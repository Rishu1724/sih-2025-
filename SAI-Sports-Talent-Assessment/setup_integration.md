# AI Analysis Integration Setup Guide

This guide will help you set up the integration between the mobile app and AI analysis scripts.

## Prerequisites

1. **Python Environment**: Make sure Python 3.7+ is installed
2. **Node.js**: Make sure Node.js is installed for the backend
3. **Required Python packages**: Install the required packages for AI analysis

## Setup Steps

### 1. Install Python Dependencies

Navigate to the backend directory and install the required Python packages:

```bash
cd "C:\Users\dedee\Downloads\sih17\New folder\SAI-Sports-Talent-Assessment\backend"
pip install -r requirements.txt
```

### 2. Install Node.js Dependencies

Install the backend dependencies:

```bash
npm install
```

### 3. Create Upload Directory

Create the temporary upload directory for videos:

```bash
mkdir uploads
mkdir uploads\temp
```

### 4. Test AI Analysis

Test the AI analysis wrapper directly:

```bash
python services\ai_analysis_wrapper.py "path\to\test\video.mp4" "sit-ups"
```

### 5. Start the Backend Server

Start the backend server:

```bash
npm run dev
```

The server will run on port 3001 by default.

### 6. Test the Integration

1. Open the mobile app
2. Navigate to Assessment Submission
3. Select an athlete and assessment type
4. Upload a video file
5. Submit the assessment
6. Check the assessments list to see AI analysis results

## Supported Assessment Types

The integration supports the following assessment types with AI analysis:

- **Sit-ups** (`sit-ups`): Core strength assessment
- **Push-ups** (`push-ups`): Upper body strength assessment  
- **Vertical Jump** (`vertical-jump`): Explosive leg power assessment
- **Shuttle Run** (`shuttle-run`): Agility and speed assessment

## API Endpoints

### Submit Assessment
- **POST** `/api/assessments/submit`
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `athleteId`: Athlete ID
  - `assessmentType`: Type of assessment
  - `video`: Video file
  - `metadata`: JSON string with additional data

### Get AI Analysis Results
- **GET** `/api/assessments/:id/ai-analysis`
- **Response**: AI analysis results including rep count, technique score, and notes

### Reprocess Assessment
- **POST** `/api/assessments/:id/reprocess`
- **Response**: Confirmation that reprocessing has started

## Troubleshooting

### Common Issues

1. **Python not found**: Make sure Python is in your PATH
2. **Video file not found**: Check that the video file path is correct
3. **AI analysis fails**: Check the console logs for detailed error messages
4. **No pose detected**: Ensure the video shows clear human poses

### Debug Mode

To enable debug logging, set the environment variable:

```bash
set DEBUG=ai-analysis
npm run dev
```

## File Structure

```
backend/
├── services/
│   ├── aiAnalysisService.js      # Node.js AI service
│   └── ai_analysis_wrapper.py   # Python wrapper script
├── routes/
│   └── assessments.js           # Updated assessment routes
├── uploads/
│   └── temp/                    # Temporary video storage
└── requirements.txt             # Python dependencies
```

## Notes

- Videos are temporarily stored in the `uploads/temp` directory during processing
- After AI analysis, temporary video files are automatically cleaned up
- The AI analysis runs asynchronously, so the API returns immediately
- Check the assessment status to see when AI analysis is complete
