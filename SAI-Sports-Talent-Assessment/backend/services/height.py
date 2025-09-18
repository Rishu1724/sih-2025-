import cv2
import mediapipe as mp
import numpy as np
import math

# ---------------- CONFIG ----------------
reference_image = "ref_front.jpeg"  # Front reference image
target_video = "target_rotate1.mp4"
reference_height_m = 1.665  # meters

mp_pose = mp.solutions.pose

# ---------------- BODY SEGMENTS ----------------
segments = [
    (mp_pose.PoseLandmark.NOSE, mp_pose.PoseLandmark.LEFT_SHOULDER),
    (mp_pose.PoseLandmark.NOSE, mp_pose.PoseLandmark.RIGHT_SHOULDER),
    (mp_pose.PoseLandmark.LEFT_SHOULDER, mp_pose.PoseLandmark.LEFT_HIP),
    (mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_HIP),
    (mp_pose.PoseLandmark.LEFT_HIP, mp_pose.PoseLandmark.LEFT_KNEE),
    (mp_pose.PoseLandmark.RIGHT_HIP, mp_pose.PoseLandmark.RIGHT_KNEE),
    (mp_pose.PoseLandmark.LEFT_KNEE, mp_pose.PoseLandmark.LEFT_ANKLE),
    (mp_pose.PoseLandmark.RIGHT_KNEE, mp_pose.PoseLandmark.RIGHT_ANKLE),
]

# ---------------- FUNCTIONS ----------------
def get_landmark_positions_3d(landmarks, img_w, img_h):
    """Return 3D positions in pixels"""
    positions = {}
    for lm in mp_pose.PoseLandmark:
        x = landmarks[lm].x * img_w
        y = landmarks[lm].y * img_h
        z = landmarks[lm].z * img_w  # approximate depth in pixel scale
        positions[lm] = np.array([x, y, z])
    return positions

def construct_fish_diagram(positions_2d):
    lengths = []
    for start, end in segments:
        x1, y1 = positions_2d[start]
        x2, y2 = positions_2d[end]
        lengths.append(np.linalg.norm([x2 - x1, y2 - y1]))
    return lengths

def draw_fish_diagram(img, positions_2d, color=(0,255,0)):
    for start, end in segments:
        x1, y1 = positions_2d[start]
        x2, y2 = positions_2d[end]
        cv2.line(img, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)

def get_pixel_height(positions_2d):
    top_y = positions_2d[mp_pose.PoseLandmark.NOSE][1]
    bottom_y = max(positions_2d[mp_pose.PoseLandmark.LEFT_ANKLE][1],
                   positions_2d[mp_pose.PoseLandmark.RIGHT_ANKLE][1])
    return bottom_y - top_y

def rotation_matrix_y(angle_rad):
    """Rotation around y-axis"""
    c, s = np.cos(angle_rad), np.sin(angle_rad)
    return np.array([[c, 0, s],
                     [0, 1, 0],
                     [-s,0, c]])

def rotate_skeleton_to_front(positions_3d):
    """
    Estimate yaw angle from shoulders and rotate skeleton to front.
    """
    left_shoulder = positions_3d[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = positions_3d[mp_pose.PoseLandmark.RIGHT_SHOULDER]

    # vector from right to left shoulder
    vec = left_shoulder - right_shoulder
    angle = math.atan2(vec[2], vec[0])  # rotation around y-axis

    # Rotate by -angle to face front
    R = rotation_matrix_y(-angle)
    rotated = {lm: R @ pos for lm, pos in positions_3d.items()}
    return rotated

def project_to_2d(positions_3d):
    """Drop Z coordinate for simple orthographic projection"""
    projected = {lm: (pos[0], pos[1]) for lm, pos in positions_3d.items()}
    return projected

# ---------------- DEPTH FUNCTIONS ----------------
def get_average_depth(positions_3d, key_landmarks=None):
    """
    Compute average z-value (depth) of selected landmarks.
    If key_landmarks is None, use all landmarks.
    """
    if key_landmarks is None:
        key_landmarks = list(positions_3d.keys())
    z_vals = [positions_3d[lm][2] for lm in key_landmarks]
    return np.mean(z_vals)

def scale_skeleton_depth(positions_3d, D_target, D_ref, anchor_index=0):
    """
    Scale skeleton coordinates based on relative depth.
    Anchor point is not affected by scaling.
    """
    scale_factor = D_target / D_ref
    anchor = positions_3d[anchor_index].copy()
    translated = {lm: pos - anchor for lm, pos in positions_3d.items()}
    scaled = {lm: pos * scale_factor for lm, pos in translated.items()}
    scaled_landmarks = {lm: pos + anchor for lm, pos in scaled.items()}
    return scaled_landmarks

# ---------------- PROCESS REFERENCE IMAGE ----------------
print("Processing reference front image...")
ref_img = cv2.imread(reference_image)
if ref_img is None:
    print("Error: cannot read reference image")
    exit()
h, w = ref_img.shape[:2]

with mp_pose.Pose(min_detection_confidence=0.5) as pose:
    res = pose.process(cv2.cvtColor(ref_img, cv2.COLOR_BGR2RGB))
    if not res.pose_landmarks:
        print("No pose detected in reference image")
        exit()
    ref_positions_3d = get_landmark_positions_3d(res.pose_landmarks.landmark, w, h)
    ref_positions_2d = project_to_2d(ref_positions_3d)
    ref_pixel_height = get_pixel_height(ref_positions_2d)
    draw_fish_diagram(ref_img, ref_positions_2d, color=(0,0,255))
    cv2.putText(ref_img, f"Ref Height: {ref_pixel_height}px", (20,40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255),2)
    cv2.imshow("Reference Front", ref_img)
    cv2.waitKey(500)
cv2.destroyAllWindows()

# Reference average depth (shoulders + hips)
ref_key_landmarks = [
    mp_pose.PoseLandmark.LEFT_SHOULDER,
    mp_pose.PoseLandmark.RIGHT_SHOULDER,
    mp_pose.PoseLandmark.LEFT_HIP,
    mp_pose.PoseLandmark.RIGHT_HIP
]
D_ref = get_average_depth(ref_positions_3d, key_landmarks=ref_key_landmarks)

# ---------------- PROCESS TARGET VIDEO ----------------
cap = cv2.VideoCapture(target_video)
estimated_heights = []

with mp_pose.Pose(min_detection_confidence=0.5) as pose:
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        hh, ww = frame.shape[:2]
        res = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if res.pose_landmarks:
            positions_3d = get_landmark_positions_3d(res.pose_landmarks.landmark, ww, hh)
            
            # Rotate skeleton to front
            rotated_3d = rotate_skeleton_to_front(positions_3d)
            
            # Compute target average depth (shoulders + hips)
            target_key_landmarks = [
                mp_pose.PoseLandmark.LEFT_SHOULDER,
                mp_pose.PoseLandmark.RIGHT_SHOULDER,
                mp_pose.PoseLandmark.LEFT_HIP,
                mp_pose.PoseLandmark.RIGHT_HIP
            ]
            D_target = get_average_depth(rotated_3d, key_landmarks=target_key_landmarks)
            
            # Scale skeleton to match reference depth
            scaled_3d = scale_skeleton_depth(rotated_3d, D_target=D_ref, D_ref=D_target,
                                             anchor_index=mp_pose.PoseLandmark.LEFT_HIP.value)
            
            # Project back to 2D
            rotated_2d = project_to_2d(scaled_3d)
            draw_fish_diagram(frame, rotated_2d, color=(0,255,0))
            
            # Draw reference skeleton in red
            draw_fish_diagram(frame, ref_positions_2d, color=(0,0,255))
            
            # Compute height
            pixel_height = get_pixel_height(rotated_2d)
            scale = pixel_height / ref_pixel_height if ref_pixel_height > 0 else 1
            estimated_height_m = scale * reference_height_m
            estimated_heights.append(estimated_height_m)
            
            cv2.putText(frame, f"Estimated Height: {estimated_height_m:.2f} m", (30,50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0),2)

        cv2.imshow("Height Estimation - Depth Normalized", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()

if estimated_heights:
    mean_height_m = sum(estimated_heights) / len(estimated_heights)
    print(f"\nMean estimated height: {mean_height_m:.2f} m")
else:
    print("No heights could be estimated.")
