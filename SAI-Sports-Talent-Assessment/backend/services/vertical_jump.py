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
    VIDEO_FILE = "your_jump_video.mp4"

# ---- TUNE THESE ----
WARMUP_FRAMES = 40
SMOOTH_WINDOW = 5
JUMP_DELTA_FRAC = 0.08  # how high they must jump (fraction of frame height)
# ---------------------

pose = mp.solutions.pose.Pose(min_detection_confidence=0.5,
                              min_tracking_confidence=0.5)
drawer = mp.solutions.drawing_utils

cap = cv2.VideoCapture(VIDEO_FILE)
if not cap.isOpened():
    result = {"error": "Could not open video"}
    print(json.dumps(result))
    exit()

smooth_hip_y = collections.deque(maxlen=SMOOTH_WINDOW)
hip_y_samples = []
frame_count = 0

jumping = False
jumps = 0
jump_heights = []  # store each jump's height
min_hip_during_jump = None

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

    if res.pose_landmarks:
        lm = res.pose_landmarks.landmark

        left_hip = safe_landmark(lm, mp.solutions.pose.PoseLandmark.LEFT_HIP.value)
        right_hip = safe_landmark(lm, mp.solutions.pose.PoseLandmark.RIGHT_HIP.value)

        if left_hip and right_hip:
            hip_cy = ((left_hip[1] + right_hip[1]) / 2.0) * h

            smooth_hip_y.append(hip_cy)
            avg_hip_y = sum(smooth_hip_y) / len(smooth_hip_y)

            if frame_count <= WARMUP_FRAMES:
                hip_y_samples.append(avg_hip_y)
            else:
                baseline_hip_y = float(np.median(hip_y_samples))
                jump_threshold = JUMP_DELTA_FRAC * h

                if not jumping and avg_hip_y < (baseline_hip_y - jump_threshold):
                    # Jump started
                    jumping = True
                    min_hip_during_jump = avg_hip_y

                if jumping:
                    # Track the highest point (lowest y)
                    if avg_hip_y < min_hip_during_jump:
                        min_hip_during_jump = avg_hip_y

                if jumping and avg_hip_y >= baseline_hip_y:
                    # Jump ended
                    jump_height = baseline_hip_y - min_hip_during_jump
                    jump_heights.append(jump_height)
                    jumps += 1
                    jumping = False

    # Skip GUI rendering for programmatic use
    # Only output the final result

cap.release()
pose.close()

# Calculate average jump height
average_height = float(np.mean(jump_heights)) if jump_heights else 0.0

# Output result as JSON
result = {
    "rep_count": jumps,
    "jump_heights": [float(h) for h in jump_heights],
    "average_height": average_height,
    "warmup_frames": WARMUP_FRAMES
}
print(json.dumps(result))