import cv2
import mediapipe as mp
from collections import deque
import sys
import json

# Check if video path is provided as argument
if len(sys.argv) > 1:
    video_filename = sys.argv[1]
else:
    video_filename = "your_pushup_video.mp4"

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

def shoulder_wrist_y(lm, h):
    """Return vertical distance between shoulder and wrist on best-visible side."""
    lv = lm[mp_pose.PoseLandmark.LEFT_SHOULDER].visibility + lm[mp_pose.PoseLandmark.LEFT_WRIST].visibility
    rv = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].visibility + lm[mp_pose.PoseLandmark.RIGHT_WRIST].visibility
    if rv >= lv:
        return (lm[mp_pose.PoseLandmark.RIGHT_WRIST].y -
                lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].y) * h
    else:
        return (lm[mp_pose.PoseLandmark.LEFT_WRIST].y -
                lm[mp_pose.PoseLandmark.LEFT_SHOULDER].y) * h

# ---------- PASS 1: find thresholds ----------
cap = cv2.VideoCapture(video_filename)
distances = []

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while True:
        ret, frame = cap.read()
        if not ret: break
        h, w = frame.shape[:2]
        res = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if res.pose_landmarks:
            d = shoulder_wrist_y(res.pose_landmarks.landmark, h)
            distances.append(d)

cap.release()
if not distances:
    result = {"error": "No pose detected."}
    print(json.dumps(result))
    exit()

down_thresh = max(distances) - 5   # chest close to floor → max distance
up_thresh   = min(distances) + 5   # body up → min distance

# ---------- PASS 2: count reps ----------
cap = cv2.VideoCapture(video_filename)
rep_count = 0
rep_in_progress = False
smooth = deque(maxlen=3)

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while True:
        ret, frame = cap.read()
        if not ret: break
        h, w = frame.shape[:2]
        res = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if res.pose_landmarks:
            d = shoulder_wrist_y(res.pose_landmarks.landmark, h)
            smooth.append(d)
            avg_d = sum(smooth)/len(smooth)

            if not rep_in_progress and avg_d > down_thresh:
                rep_in_progress = True
            elif rep_in_progress and avg_d < up_thresh:
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