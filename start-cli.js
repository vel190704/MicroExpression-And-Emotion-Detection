#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');

console.log(chalk.bold.blue('🎥 Professional Emotion Detection CLI'));
console.log(chalk.yellow('📊 Real-time thought analysis and emotion detection'));
console.log(chalk.cyan('🧠 Advanced micro-expression analysis\n'));

console.log(chalk.green('Starting emotion detection system...'));
console.log(chalk.gray('Note: This will access your camera for live analysis\n'));

// Start the main CLI application
const child = spawn('node', ['emotion-cli.js'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('error', (error) => {
  console.error(chalk.red('Failed to start emotion detection:'), error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(chalk.yellow(`\nEmotion detection system exited with code ${code}`));
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nShutting down emotion detection system...'));
  child.kill('SIGINT');
});