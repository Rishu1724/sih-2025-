#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

console.log('SAI Sports Talent Assessment - Development Server Starter');
console.log('========================================================\n');

console.log('Choose connection option:');
console.log('1. Tunnel (default) - Works from anywhere but can be unstable');
console.log('2. LAN - More stable but requires same network');
console.log('3. Web - Run in browser');
console.log('4. Clear cache and start with tunnel');
console.log('5. Exit\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your choice (1-5): ', (answer) => {
  rl.close();
  
  let command;
  switch(answer.trim()) {
    case '1':
      command = 'npx expo start --tunnel';
      break;
    case '2':
      command = 'npx expo start --lan';
      break;
    case '3':
      command = 'npx expo start --web';
      break;
    case '4':
      command = 'npx expo start --clear';
      break;
    case '5':
      console.log('Goodbye!');
      process.exit(0);
    default:
      console.log('Invalid choice, using tunnel option...');
      command = 'npx expo start --tunnel';
  }
  
  console.log(`\nStarting development server with: ${command}\n`);
  
  const child = spawn(command, { 
    shell: true,
    stdio: 'inherit'
  });
  
  child.on('error', (error) => {
    console.error('Failed to start development server:', error);
  });
  
  child.on('close', (code) => {
    console.log(`Development server process exited with code ${code}`);
  });
});