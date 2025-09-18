/**
 * Test script for AI Analysis Integration
 * Run this to test the AI analysis functionality
 */

const aiAnalysisService = require('./services/aiAnalysisService');
const path = require('path');

async function testAIAnalysis() {
  console.log('🧪 Testing AI Analysis Integration...\n');

  // Test with a sample video (you'll need to provide a real video file)
  const testVideoPath = path.join(__dirname, 'test_video.mp4');
  
  // Check if test video exists
  const fs = require('fs');
  if (!fs.existsSync(testVideoPath)) {
    console.log('❌ Test video not found. Please place a test video at:', testVideoPath);
    console.log('   You can use any of the sample videos from the sih (2) folder.\n');
    return;
  }

  const testCases = [
    { type: 'sit-ups', name: 'Sit-ups Analysis' },
    { type: 'push-ups', name: 'Push-ups Analysis' },
    { type: 'vertical-jump', name: 'Vertical Jump Analysis' },
    { type: 'shuttle-run', name: 'Shuttle Run Analysis' }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Testing ${testCase.name}...`);
    
    try {
      const startTime = Date.now();
      const result = await aiAnalysisService.analyzeVideo(testVideoPath, testCase.type);
      const processingTime = (Date.now() - startTime) / 1000;
      
      console.log(`✅ ${testCase.name} completed in ${processingTime.toFixed(2)}s`);
      console.log(`   Rep Count: ${result.aiRepCount}`);
      console.log(`   Technique Score: ${(result.aiTechniqueScore * 100).toFixed(1)}%`);
      console.log(`   Notes: ${result.aiNotes}`);
      
      if (result.additionalMetrics && Object.keys(result.additionalMetrics).length > 0) {
        console.log(`   Additional Metrics:`, result.additionalMetrics);
      }
      
      if (result.error) {
        console.log(`   ⚠️  Error: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ ${testCase.name} failed: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎉 AI Analysis testing completed!');
}

// Run the test
testAIAnalysis().catch(console.error);
