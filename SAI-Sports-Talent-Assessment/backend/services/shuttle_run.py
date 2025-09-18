import cv2
import collections
import numpy as np
import mediapipe as mp
import sys
import json

# Check if video path is provided as argument
if len(sys.argv) > 1:
    VIDEO_FILE = sys.argv[1]
else:
    VIDEO_FILE = "your_shuttle_video.mp4"

# ---- TUNE THESE ----
WARMUP_FRAMES = 40
SMOOTH_WINDOW = 5
VELOCITY_THRESHOLD = 2.0
BEND_DELTA_FRAC = 0.04
# ---------------------

pose = mp.solutions.pose.Pose(min_detection_confidence=0.5,
                              min_tracking_confidence=0.5)
drawer = mp.solutions.drawing_utils

cap = cv2.VideoCapture(VIDEO_FILE)
if not cap.isOpened():
    result = {"error": "Could not open video"}
    print(json.dumps(result))
    exit()

smooth_x = collections.deque(maxlen=SMOOTH_WINDOW)
smooth_hand_rel = collections.deque(maxlen=SMOOTH_WINDOW)
hand_rel_samples = []
frame_count = 0

prev_x = None
prev_direction = None
shuttles = 0  # <-- now counts full shuttles directly

def safe_landmark(lm_list, idx):
    try:
        lm = lm_list[idx]
        return lm.x, lm.y, getattr(lm, "visibility", 1.0)
    except Exception:
        return None

while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame_count += 1
    h, w = frame.shape[:2]

    res = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    avg_x = None
    avg_hand_rel = None

    if res.pose_landmarks:
        lm = res.pose_landmarks.landmark

        left_hip = safe_landmark(lm, mp.solutions.pose.PoseLandmark.LEFT_HIP.value)
        right_hip = safe_landmark(lm, mp.solutions.pose.PoseLandmark.RIGHT_HIP.value)
        if left_hip and right_hip:
            hip_cx = ((left_hip[0] + right_hip[0]) / 2.0) * w
            hip_cy = ((left_hip[1] + right_hip[1]) / 2.0) * h
        else:
            hip_cx = None
            hip_cy = None

        lw = safe_landmark(lm, mp.solutions.pose.PoseLandmark.LEFT_WRIST.value)
        rw = safe_landmark(lm, mp.solutions.pose.PoseLandmark.RIGHT_WRIST.value)

        if hip_cx is not None and hip_cy is not None and lw and rw:
            left_wy = lw[1] * h
            right_wy = rw[1] * h
            hand_y = max(left_wy, right_wy)
            hand_rel = hand_y - hip_cy

            smooth_x.append(hip_cx)
            smooth_hand_rel.append(hand_rel)
            avg_x = sum(smooth_x) / len(smooth_x)
            avg_hand_rel = sum(smooth_hand_rel) / len(smooth_hand_rel)

            if frame_count <= WARMUP_FRAMES:
                hand_rel_samples.append(avg_hand_rel)
            else:
                if len(hand_rel_samples) > 0:
                    baseline_hand_rel = float(np.median(hand_rel_samples))
                    bend_threshold_px = BEND_DELTA_FRAC * h
                    bending = avg_hand_rel > (baseline_hand_rel + bend_threshold_px)

                    if prev_x is not None:
                        velocity = avg_x - prev_x
                        if abs(velocity) > VELOCITY_THRESHOLD:
                            direction = "right" if velocity > 0 else "left"
                            if prev_direction is not None and direction != prev_direction and bending:
                                shuttles += 1  # ✅ 1 bend = +1 shuttle
                            prev_direction = direction
                    prev_x = avg_x

    # Skip GUI rendering for programmatic use
    # Only output the final result

cap.release()
pose.close()

# Output result as JSON
result = {
    "rep_count": shuttles,
    "warmup_frames": WARMUP_FRAMES
}
print(json.dumps(result))