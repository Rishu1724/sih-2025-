import cv2
import mediapipe as mp
import numpy as np
import time
import math

# ---------------- CONFIG ----------------
REFERENCE_HEIGHT_CM = 166.5  # real height of the person in reference images
REFERENCE_IMAGES = {
    "front": "ref_front.jpeg",
    "back":  "ref_back.jpeg",
    "left":  "ref_left.jpeg",
    "right": "ref_right.jpeg"
}
DIRECTIONS = ["front", "left", "right", "back"]
STABLE_FRAMES = 5
PIXEL_TOLERANCE = 6
CAPTURE_MODE = "B"  # "A" = Auto, "B" = Manual (SPACE)
# ids we consider as "head-area" to get top-of-head robustly
HEAD_IDS = [0, 1, 2, 3, 4, 5, 6]  # nose, eyes, ears, mouth-ish
LEFT_FOOT_ID = 31
RIGHT_FOOT_ID = 32
# ----------------------------------------

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
mp_draw = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def get_keypoints_and_landmarks(image):
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)
    kp = {}
    if results.pose_landmarks:
        h, w = image.shape[:2]
        for i, lm in enumerate(results.pose_landmarks.landmark):
            kp[i] = (int(lm.x * w), int(lm.y * h))
    return kp, results.pose_landmarks

def head_top_y(kp):
    ys = [kp[i][1] for i in HEAD_IDS if i in kp]
    return min(ys) if ys else None

def feet_avg_y(kp):
    if LEFT_FOOT_ID in kp and RIGHT_FOOT_ID in kp:
        return (kp[LEFT_FOOT_ID][1] + kp[RIGHT_FOOT_ID][1]) / 2.0
    if LEFT_FOOT_ID in kp:
        return kp[LEFT_FOOT_ID][1]
    if RIGHT_FOOT_ID in kp:
        return kp[RIGHT_FOOT_ID][1]
    return None

def head_to_feet_px(kp):
    top = head_top_y(kp)
    feet = feet_avg_y(kp)
    if top is None or feet is None:
        return None
    return feet - top

def rescale_reference_keypoints(original_kp, orig_size, new_size):
    """Rescale reference keypoints from orig image space to new_size (w,h)."""
    ow, oh = orig_size
    nw, nh = new_size
    kp_rescaled = {}
    for i, (x, y) in original_kp.items():
        rx = int(x * (nw / ow))
        ry = int(y * (nh / oh))
        kp_rescaled[i] = (rx, ry)
    return kp_rescaled

def transform_points(points, M):
    """Apply 2x3 affine M to iterable of (x,y). Returns list of (x,y)."""
    out = []
    for (x, y) in points:
        nx = M[0,0]*x + M[0,1]*y + M[0,2]
        ny = M[1,0]*x + M[1,1]*y + M[1,2]
        out.append((int(nx), int(ny)))
    return out

# load and preprocess references
reference_data = {}
for direction, path in REFERENCE_IMAGES.items():
    img = cv2.imread(path)
    if img is None:
        raise FileNotFoundError(f"Reference image '{path}' not found.")
    kp_orig, lm = get_keypoints_and_landmarks(img)
    if head_to_feet_px(kp_orig) is None:
        raise ValueError(f"Reference image '{path}' does not contain full body keypoints.")
    reference_data[direction] = {"image": img, "kp_orig": kp_orig, "landmarks": lm}

# open webcam
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

user_heights = []

for direction in DIRECTIONS:
    ref = reference_data[direction]["image"]
    ref_kp_orig = reference_data[direction]["kp_orig"]
    ref_landmarks = reference_data[direction]["landmarks"]

    print(f"Turn: {direction.upper()}")
    captured = False
    pixel_history = []

    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        frame = cv2.flip(frame, 1)
        fh, fw = frame.shape[:2]

        # Resize reference to match same display height as frame (we'll show side-by-side),
        # keep ref width at half of combined window as before
        ref_display_w = fw // 2
        ref_display_h = fh
        ref_resized = cv2.resize(ref, (ref_display_w, ref_display_h))

        # make rescaled reference keypoints in resized coordinates
        orig_h, orig_w = ref.shape[:2]
        ref_kp = rescale_reference_keypoints(ref_kp_orig, (orig_w, orig_h), (ref_display_w, ref_display_h))

        # draw reference landmarks on resized ref
        if ref_landmarks:
            # tricky: mediapipe expects normalized landmarks and original size; easiest is draw on original resized landmarks via mp drawing by converting ref_kp into LandmarkList is messy.
            # We'll draw our own simple skeleton lines by mapping mp_pose.POSE_CONNECTIONS to available ref_kp points.
            for a, b in mp_pose.POSE_CONNECTIONS:
                if a in ref_kp and b in ref_kp:
                    cv2.line(ref_resized, ref_kp[a], ref_kp[b], (200,200,200), 2)
            for i, p in ref_kp.items():
                cv2.circle(ref_resized, p, 4, (0,200,200), -1)

        # get user keypoints in original frame coords
        user_kp, user_landmarks = get_keypoints_and_landmarks(frame)

        # Compute pixel heights in consistent coordinate systems (ref_resized vs frame)
        ref_px = head_to_feet_px(ref_kp)  # in ref_resized pixel coords
        user_px = head_to_feet_px(user_kp)  # in frame pixel coords

        # If we have both, compute live height using consistent ratio:
        # pixels_per_cm (ref) = ref_px / REFERENCE_HEIGHT_CM  -> live_cm = user_px / (ref_px / REF_CM) = REF_CM * (user_px / ref_px)
        live_height_cm = None
        if ref_px and user_px and ref_px > 5:
            live_height_cm = REFERENCE_HEIGHT_CM * (user_px / ref_px)
            pixel_history.append(live_height_cm)
            if len(pixel_history) > STABLE_FRAMES:
                pixel_history.pop(0)

        # Visual alignment: compute scale / translation to place user's skeleton near ref toes
        # We'll compute scale so that user_px * scale == ref_px_resized, and place feet of user near feet of reference (y translation).
        aligned_frame = frame.copy()
        draw_user_kp = dict(user_kp)  # default drawing uses original points
        if ref_px and user_px and user_px > 3:
            scale = ref_px / user_px
            # feet positions:
            ref_feet_y = feet_avg_y(ref_kp)
            user_feet_y = feet_avg_y(user_kp)
            # dy to move scaled user's feet to reference feet (in full frame coordinates)
            # user coordinates will scale relative to top-left origin; we want M such that
            # (x', y') = scale*(x,y) + (0, dy) and y' of user's feet equals ref_feet_y (but ref is in left half, so we just align vertically)
            dy = ref_feet_y - (user_feet_y * scale)
            # build affine matrix
            M = np.array([[scale, 0.0, 0.0],
                          [0.0, scale, dy]])
            # apply transform to user image for side-by-side view (not used for calculation)
            try:
                aligned_frame = cv2.warpAffine(frame, M, (fw, fh))
            except Exception:
                aligned_frame = frame.copy()
            # transform the user keypoints (so drawn skeleton matches aligned_frame)
            pts = [user_kp[i] for i in sorted(user_kp.keys())]
            pts_t = transform_points(pts, M)
            draw_user_kp = {k: pts_t[idx] for idx, k in enumerate(sorted(user_kp.keys()))}

        # draw skeleton on aligned_frame using draw_user_kp
        for a, b in mp_pose.POSE_CONNECTIONS:
            if a in draw_user_kp and b in draw_user_kp:
                cv2.line(aligned_frame, draw_user_kp[a], draw_user_kp[b], (255,255,255), 2)
        for i, p in draw_user_kp.items():
            cv2.circle(aligned_frame, p, 4, (0,180,255), -1)

        # Annotate height
        display_frame = aligned_frame.copy()
        if live_height_cm is not None:
            # show smoothed (mean) value
            if len(pixel_history) > 0:
                smooth = sum(pixel_history)/len(pixel_history)
            else:
                smooth = live_height_cm
            cv2.putText(display_frame, f"Live Height: {smooth:.2f} cm", (40, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,0,255), 2)

        # Full body check: the (original) user's head must be near top and feet near bottom (loosen a bit)
        body_in_frame = False
        if user_kp:
            top = head_top_y(user_kp)
            feet = feet_avg_y(user_kp)
            if top is not None and feet is not None:
                if top < fh * 0.08 and feet > fh * 0.9:
                    body_in_frame = True

        if CAPTURE_MODE == "B" and body_in_frame:
            cv2.putText(display_frame, "Press SPACE to capture", (40, 110),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

        # combine reference and user display (ref on left)
        combined = np.hstack((ref_resized, display_frame))
        cv2.imshow("Height Estimation", combined)

        key = cv2.waitKey(1) & 0xFF
        if key == 27:
            cap.release()
            cv2.destroyAllWindows()
            exit()

        # ---- NEW FEATURE: screenshot + auto-advance ----
        if CAPTURE_MODE == "B" and key == 32 and body_in_frame:
            if pixel_history:
                final = sum(pixel_history)/len(pixel_history)
                print(f"{direction.capitalize()} height: {final:.2f} cm")
                user_heights.append(final)
                shot_name = f"height_capture_{direction}.png"
                cv2.imwrite(shot_name, combined)
                print(f"Screenshot saved: {shot_name}")
                captured = True
                time.sleep(0.8)
        # -----------------------------------------------

        if CAPTURE_MODE == "A":
            if body_in_frame and len(pixel_history) >= STABLE_FRAMES and max(pixel_history)-min(pixel_history) <= PIXEL_TOLERANCE:
                final = sum(pixel_history)/len(pixel_history)
                print(f"{direction.capitalize()} height (auto): {final:.2f} cm")
                user_heights.append(final)
                cv2.imwrite(f"height_capture_{direction}.png", combined)
                captured = True
                time.sleep(0.8)

        if captured:
            break

# finalize
cap.release()
cv2.destroyAllWindows()
if user_heights:
    print(f"\nEstimated Height (avg of turns): {sum(user_heights)/len(user_heights):.2f} cm")
else:
    print("No heights detected.")
