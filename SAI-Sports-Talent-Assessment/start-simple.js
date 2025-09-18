#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('Starting Expo server without image picker dependencies...');

const child = spawn('npx', ['expo', 'start', '--clear', '--port', '8083'], { 
  cwd: 'C:\\Users\\rishu\\OneDrive\\Desktop\\New folder\\SAI-Sports-Talent-Assessment',
  shell: true,
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('Failed to start Expo server:', error);
});

child.on('close', (code) => {
  console.log(`Expo server process exited with code ${code}`);
});