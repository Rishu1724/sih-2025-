import cv2
import mediapipe as mp
import os
import csv
import time

# ---------------- CONFIG ----------------
REFERENCE_HEIGHT_CM = 166.5  # Known height of reference person/object
REFERENCE_IMAGE = "ref_images/ref_front.jpg"
DIRECTIONS = ["front", "left", "right", "back"]
CAPTURE_DIR = "captures"
CSV_FILE = "height_data.csv"

# Ensure capture directory exists
os.makedirs(CAPTURE_DIR, exist_ok=True)

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False)
mp_draw = mp.solutions.drawing_utils

# ---------------- HELPER FUNCTIONS ----------------
def estimate_height(image, scale):
    height_img, width_img, _ = image.shape
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)
    
    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        nose_y = landmarks[mp_pose.PoseLandmark.NOSE].y * height_img
        left_ankle_y = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].y * height_img
        right_ankle_y = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].y * height_img
        ankle_y = max(left_ankle_y, right_ankle_y)
        pixel_height = ankle_y - nose_y
        return pixel_height * scale
    else:
        return None

def get_reference_scale(ref_image_path):
    # Simple approximation: detect person and assume full image height
    ref_img = cv2.imread(ref_image_path)
    h, _, _ = ref_img.shape
    scale = REFERENCE_HEIGHT_CM / h
    return scale

def save_height_to_csv(direction, height_cm):
    file_exists = os.path.isfile(CSV_FILE)
    with open(CSV_FILE, mode='a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Timestamp", "Direction", "Height_cm"])
        writer.writerow([time.strftime("%Y-%m-%d %H:%M:%S"), direction, round(height_cm, 2)])

# ---------------- MAIN LOOP ----------------
cap = cv2.VideoCapture(0)
scale = get_reference_scale(REFERENCE_IMAGE)
current_direction_idx = 0

print("Press SPACE to capture height and move to next direction.")
print("Press ESC to exit.")

while cap.isOpened() and current_direction_idx < len(DIRECTIONS):
    ret, frame = cap.read()
    if not ret:
        break
    
    direction = DIRECTIONS[current_direction_idx]
    cv2.putText(frame, f"Direction: {direction}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
    
    cv2.imshow("Height Detection", frame)
    
    key = cv2.waitKey(1) & 0xFF
    if key == 27:  # ESC key
        break
    elif key == 32:  # SPACE key
        estimated_height = estimate_height(frame, scale)
        if estimated_height:
            filename = f"{CAPTURE_DIR}/{direction}_{int(time.time())}.jpg"
            cv2.imwrite(filename, frame)
            save_height_to_csv(direction, estimated_height)
            print(f"[{direction}] Height: {round(estimated_height, 2)} cm captured and saved.")
        else:
            print(f"[{direction}] Pose not detected, try again.")
        current_direction_idx += 1

cap.release()
cv2.destroyAllWindows()
