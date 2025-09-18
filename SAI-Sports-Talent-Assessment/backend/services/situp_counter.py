import cv2
import mediapipe as mp
from collections import deque
import sys
import json

# Check if video path is provided as argument
if len(sys.argv) > 1:
    video_filename = sys.argv[1]
else:
    video_filename = "your_video.mp4"

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

def get_shoulder_hip_y(lm, w, h):
    """Return the y-coordinate of the shoulder and hip of the side with better visibility."""
    lv = lm[mp_pose.PoseLandmark.LEFT_SHOULDER].visibility + lm[mp_pose.PoseLandmark.LEFT_HIP].visibility
    rv = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].visibility + lm[mp_pose.PoseLandmark.RIGHT_HIP].visibility

    if rv >= lv:
        sh_y = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].y * h
        hp_y = lm[mp_pose.PoseLandmark.RIGHT_HIP].y * h
    else:
        sh_y = lm[mp_pose.PoseLandmark.LEFT_SHOULDER].y * h
        hp_y = lm[mp_pose.PoseLandmark.LEFT_HIP].y * h
    return sh_y, hp_y

# --------- PASS 1: Determine thresholds ----------
cap = cv2.VideoCapture(video_filename)
y_diffs = []

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while True:
        ret, frame = cap.read()
        if not ret: break
        h, w = frame.shape[:2]
        res = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if res.pose_landmarks:
            sh_y, hp_y = get_shoulder_hip_y(res.pose_landmarks.landmark, w, h)
            y_diff = hp_y - sh_y  # shoulder above hip → positive
            y_diffs.append(y_diff)

cap.release()

if not y_diffs:
    result = {"error": "No pose detected."}
    print(json.dumps(result))
    exit()

# Up: torso contracted (shoulder close to hip)
up_thresh = min(y_diffs) + 10
# Down: torso extended (shoulder far from hip)
down_thresh = max(y_diffs) - 10

# --------- PASS 2: Count reps ----------
cap = cv2.VideoCapture(video_filename)
rep_count = 0
rep_in_progress = False
smooth_queue = deque(maxlen=3)

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while True:
        ret, frame = cap.read()
        if not ret: break
        h, w = frame.shape[:2]
        res = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if res.pose_landmarks:
            sh_y, hp_y = get_shoulder_hip_y(res.pose_landmarks.landmark, w, h)
            y_diff = hp_y - sh_y
            smooth_queue.append(y_diff)
            smooth_diff = sum(smooth_queue)/len(smooth_queue)

            # Rep detection
            if not rep_in_progress and smooth_diff > down_thresh:
                rep_in_progress = True
            elif rep_in_progress and smooth_diff < up_thresh:
                rep_count += 1
                rep_in_progress = False

        # Skip GUI rendering for programmatic use
        # Only output the final result

cap.release()

# Output result as JSON
result = {
    "rep_count": rep_count,
    "up_threshold": up_thresh,
    "down_threshold": down_thresh
}
print(json.dumps(result))