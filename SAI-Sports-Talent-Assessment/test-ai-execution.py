#!/usr/bin/env python3
"""
Test script to verify AI code execution for each assessment type
"""

import subprocess
import sys
import os
import json

def test_assessment_type(assessment_type, script_name):
    """Test a specific assessment type"""
    print(f"\n=== Testing {assessment_type} ===")
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    ai_wrapper = os.path.join(script_dir, "backend", "services", "ai_analysis_wrapper.py")
    
    # Create a simple test video (just a black frame)
    test_video = os.path.join(script_dir, "test_video.mp4")
    
    try:
        # Create a simple test video using OpenCV
        import cv2
        import numpy as np
        
        # Create a 5-second black video at 30fps
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(test_video, fourcc, 30.0, (640, 480))
        
        for _ in range(150):  # 5 seconds at 30fps
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            out.write(frame)
        
        out.release()
        print(f"Created test video: {test_video}")
        
    except ImportError:
        print("OpenCV not available, creating a simple text file")
        with open(test_video, 'w') as f:
            f.write("This is a test video file")
    
    # Run the AI analysis wrapper
    try:
        result = subprocess.run([
            sys.executable, ai_wrapper, test_video, assessment_type
        ], capture_output=True, text=True, timeout=30)
        
        print(f"Return code: {result.returncode}")
        print(f"Stdout: {result.stdout}")
        print(f"Stderr: {result.stderr}")
        
        # Try to parse JSON output
        try:
            output = json.loads(result.stdout)
            print(f"Parsed JSON output: {output}")
            return True
        except json.JSONDecodeError:
            print("Failed to parse JSON output")
            return False
            
    except subprocess.TimeoutExpired:
        print("Test timed out")
        return False
    except Exception as e:
        print(f"Test failed with error: {e}")
        return False
    finally:
        # Clean up test video
        if os.path.exists(test_video):
            os.remove(test_video)
            print(f"Cleaned up test video: {test_video}")

def main():
    """Test all assessment types"""
    print("Testing AI code execution for all assessment types")
    
    assessment_types = {
        "sit-ups": "situp_counter.py",
        "push-ups": "pushup.py",
        "vertical-jump": "vertical_jump.py",
        "shuttle-run": "shuttle_run.py"
    }
    
    results = {}
    
    for assessment_type, script_name in assessment_types.items():
        success = test_assessment_type(assessment_type, script_name)
        results[assessment_type] = success
    
    print("\n=== Test Results ===")
    for assessment_type, success in results.items():
        status = "PASS" if success else "FAIL"
        print(f"{assessment_type}: {status}")
    
    # Overall result
    all_passed = all(results.values())
    print(f"\nOverall: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())