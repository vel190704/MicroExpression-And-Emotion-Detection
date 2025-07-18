const cv = require('opencv4nodejs');
const blessed = require('blessed');
const chalk = require('chalk');
const Table = require('cli-table3');
const figlet = require('figlet');

class EmotionDetectionCLI {
  constructor() {
    this.emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'contempt', 'guilt'];
    this.emotionHistory = [];
    this.thoughtMappings = {
      fear: {
        microExpression: 'Eye widening, rapid blinking',
        thoughtInference: 'Hiding something, worried about exposure',
        riskLevel: 'HIGH',
        indicators: ['Pupil dilation', 'Eyebrow flash', 'Mouth tension']
      },
      disgusted: {
        microExpression: 'Nose wrinkle, upper lip raise',
        thoughtInference: 'Rejecting idea, disagreeing internally',
        riskLevel: 'MEDIUM',
        indicators: ['Nostril flare', 'Mouth corner down', 'Eye squint']
      },
      contempt: {
        microExpression: 'Half-smile/sneer, eye roll',
        thoughtInference: "Believes they're smarter, dismissive",
        riskLevel: 'HIGH',
        indicators: ['Unilateral lip raise', 'Head tilt back', 'Narrowed eyes']
      },
      guilt: {
        microExpression: 'Downward gaze, shoulder shrug',
        thoughtInference: 'Regret or knowledge of wrongdoing',
        riskLevel: 'VERY HIGH',
        indicators: ['Hand to face', 'Lip compression', 'Chin raise']
      },
      angry: {
        microExpression: 'Brow tension, jaw clench',
        thoughtInference: 'Defensive, frustrated, possibly lying',
        riskLevel: 'HIGH',
        indicators: ['Furrowed brow', 'Tight lips', 'Nostril flare']
      },
      surprised: {
        microExpression: 'Eyebrow raise, mouth open',
        thoughtInference: 'Unexpected question, caught off guard',
        riskLevel: 'MEDIUM',
        indicators: ['Wide eyes', 'Dropped jaw', 'Forehead wrinkles']
      },
      happy: {
        microExpression: 'Genuine smile, eye crinkles',
        thoughtInference: 'Confident, truthful, comfortable',
        riskLevel: 'LOW',
        indicators: ['Duchenne smile', 'Raised cheeks', 'Crow\'s feet']
      },
      sad: {
        microExpression: 'Lip corner down, brow furrow',
        thoughtInference: 'Remorse, disappointment, emotional stress',
        riskLevel: 'MEDIUM',
        indicators: ['Drooping eyelids', 'Lip tremor', 'Chin raise']
      },
      neutral: {
        microExpression: 'Relaxed facial muscles',
        thoughtInference: 'Calm, processing information normally',
        riskLevel: 'LOW',
        indicators: ['Steady gaze', 'Relaxed jaw', 'Natural breathing']
      }
    };
    
    this.sessionId = `session_${Date.now()}`;
    this.startTime = new Date();
    this.detectionCount = 0;
    this.currentEmotion = 'neutral';
    this.confidence = 0;
    
    this.initializeScreen();
    this.startVideoCapture();
  }

  initializeScreen() {
    // Create blessed screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Professional Emotion Detection System - CLI'
    });

    // Header
    this.headerBox = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: 5,
      content: this.getHeader(),
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'blue',
        border: {
          fg: 'cyan'
        }
      }
    });

    // Live emotion display
    this.emotionBox = blessed.box({
      top: 5,
      left: 0,
      width: '50%',
      height: 12,
      label: ' Current Analysis ',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: 'green'
        }
      }
    });

    // Thought analysis
    this.thoughtBox = blessed.box({
      top: 5,
      left: '50%',
      width: '50%',
      height: 12,
      label: ' Thought Inference ',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: 'yellow'
        }
      }
    });

    // Statistics
    this.statsBox = blessed.box({
      top: 17,
      left: 0,
      width: '100%',
      height: 8,
      label: ' Session Statistics ',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: 'magenta'
        }
      }
    });

    // Video status
    this.videoBox = blessed.box({
      top: 25,
      left: 0,
      width: '100%',
      height: 5,
      label: ' Video Feed Status ',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: 'red'
        }
      }
    });

    // Add all boxes to screen
    this.screen.append(this.headerBox);
    this.screen.append(this.emotionBox);
    this.screen.append(this.thoughtBox);
    this.screen.append(this.statsBox);
    this.screen.append(this.videoBox);

    // Key bindings
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.cleanup();
      process.exit(0);
    });

    this.screen.render();
  }

  getHeader() {
    return `
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                    PROFESSIONAL EMOTION DETECTION SYSTEM                            ║
║                           Real-Time Thought Analysis                                 ║
║                              Session: ${this.sessionId.slice(-8)}                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════╝`;
  }

  async startVideoCapture() {
    try {
      // Initialize webcam
      this.cap = new cv.VideoCapture(0);
      
      if (!this.cap.isOpened()) {
        throw new Error('Cannot open camera');
      }

      this.updateVideoStatus('Camera initialized successfully', 'green');
      
      // Start processing loop
      this.processVideo();
      
    } catch (error) {
      this.updateVideoStatus(`Camera Error: ${error.message}`, 'red');
      console.error('Camera initialization failed:', error);
    }
  }

  async processVideo() {
    try {
      const frame = this.cap.read();
      
      if (frame.empty) {
        this.updateVideoStatus('No video frame received', 'yellow');
        setTimeout(() => this.processVideo(), 100);
        return;
      }

      // Simulate emotion detection (in real implementation, you'd use ML models)
      const emotion = this.detectEmotion(frame);
      this.updateAnalysis(emotion);
      
      this.updateVideoStatus(`Video feed active - Frame: ${frame.rows}x${frame.cols}`, 'green');
      
      // Continue processing
      setTimeout(() => this.processVideo(), 1000); // Process every second
      
    } catch (error) {
      this.updateVideoStatus(`Processing Error: ${error.message}`, 'red');
      setTimeout(() => this.processVideo(), 1000);
    }
  }

  detectEmotion(frame) {
    // Simulate emotion detection with realistic patterns
    const emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];
    
    // Add some logic to make emotions more realistic
    const time = Date.now();
    const variation = Math.sin(time / 10000) * 0.3; // Slow variation
    const noise = (Math.random() - 0.5) * 0.4; // Random noise
    
    let emotionIndex = Math.floor((variation + noise + 1) * emotions.length / 2);
    emotionIndex = Math.max(0, Math.min(emotions.length - 1, emotionIndex));
    
    const emotion = emotions[emotionIndex];
    const confidence = 0.6 + Math.random() * 0.3; // 60-90% confidence
    
    return { emotion, confidence };
  }

  updateAnalysis(detection) {
    this.currentEmotion = detection.emotion;
    this.confidence = detection.confidence;
    this.detectionCount++;
    
    // Add to history
    this.emotionHistory.push({
      emotion: detection.emotion,
      confidence: detection.confidence,
      timestamp: new Date()
    });
    
    // Keep only last 20 detections
    if (this.emotionHistory.length > 20) {
      this.emotionHistory.shift();
    }
    
    this.updateEmotionDisplay();
    this.updateThoughtDisplay();
    this.updateStatsDisplay();
    this.screen.render();
  }

  updateEmotionDisplay() {
    const confidenceBar = '█'.repeat(Math.floor(this.confidence * 20));
    const confidenceEmpty = '░'.repeat(20 - Math.floor(this.confidence * 20));
    
    const content = `
${chalk.bold.cyan('CURRENT EMOTION:')} ${chalk.bold.yellow(this.currentEmotion.toUpperCase())}

${chalk.bold.cyan('CONFIDENCE:')} ${(this.confidence * 100).toFixed(1)}%
${chalk.green(confidenceBar)}${chalk.gray(confidenceEmpty)}

${chalk.bold.cyan('MICRO-EXPRESSIONS:')}
${this.thoughtMappings[this.currentEmotion]?.microExpression || 'Processing...'}

${chalk.bold.cyan('DETECTION COUNT:')} ${this.detectionCount}
${chalk.bold.cyan('SESSION TIME:')} ${Math.floor((Date.now() - this.startTime.getTime()) / 1000)}s
`;
    
    this.emotionBox.setContent(content);
  }

  updateThoughtDisplay() {
    const mapping = this.thoughtMappings[this.currentEmotion];
    if (!mapping) return;
    
    const riskColor = mapping.riskLevel === 'VERY HIGH' ? 'red' : 
                     mapping.riskLevel === 'HIGH' ? 'yellow' : 
                     mapping.riskLevel === 'MEDIUM' ? 'cyan' : 'green';
    
    const content = `
${chalk.bold.magenta('THOUGHT INFERENCE:')}
${chalk.white(mapping.thoughtInference)}

${chalk.bold.magenta('RISK LEVEL:')} ${chalk.bold[riskColor](mapping.riskLevel)}

${chalk.bold.magenta('BEHAVIORAL INDICATORS:')}
${mapping.indicators.map(indicator => `• ${indicator}`).join('\n')}

${chalk.bold.magenta('PSYCHOLOGICAL STATE:')}
${this.getpsychologicalAssessment()}
`;
    
    this.thoughtBox.setContent(content);
  }

  getpsychologicalAssessment() {
    const recentEmotions = this.emotionHistory.slice(-5);
    const stressEmotions = recentEmotions.filter(e => ['angry', 'fearful', 'disgusted'].includes(e.emotion));
    const positiveEmotions = recentEmotions.filter(e => ['happy', 'surprised'].includes(e.emotion));
    
    if (stressEmotions.length > 3) {
      return chalk.red('High stress indicators detected');
    } else if (positiveEmotions.length > 3) {
      return chalk.green('Positive emotional state');
    } else {
      return chalk.yellow('Neutral psychological state');
    }
  }

  updateStatsDisplay() {
    const emotionCounts = this.emotionHistory.reduce((acc, item) => {
      acc[item.emotion] = (acc[item.emotion] || 0) + 1;
      return acc;
    }, {});
    
    const avgConfidence = this.emotionHistory.length > 0 
      ? this.emotionHistory.reduce((sum, item) => sum + item.confidence, 0) / this.emotionHistory.length 
      : 0;
    
    const table = new Table({
      head: ['Emotion', 'Count', 'Percentage'],
      style: { head: ['cyan'] }
    });
    
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      const percentage = ((count / this.emotionHistory.length) * 100).toFixed(1);
      table.push([emotion, count, `${percentage}%`]);
    });
    
    const content = `
${chalk.bold.cyan('EMOTION DISTRIBUTION:')}
${table.toString()}

${chalk.bold.cyan('AVERAGE CONFIDENCE:')} ${(avgConfidence * 100).toFixed(1)}%
${chalk.bold.cyan('TOTAL DETECTIONS:')} ${this.detectionCount}
`;
    
    this.statsBox.setContent(content);
  }

  updateVideoStatus(message, color = 'white') {
    const timestamp = new Date().toLocaleTimeString();
    const content = `
${chalk.bold.cyan('CAMERA STATUS:')} ${chalk[color](message)}
${chalk.bold.cyan('LAST UPDATE:')} ${timestamp}
${chalk.bold.cyan('RESOLUTION:')} 640x480 (if available)
${chalk.bold.cyan('FPS:')} ~1 (processing rate)
`;
    
    this.videoBox.setContent(content);
  }

  cleanup() {
    if (this.cap) {
      this.cap.release();
    }
    if (this.screen) {
      this.screen.destroy();
    }
  }
}

// Start the application
console.log(chalk.bold.blue(figlet.textSync('EMOTION AI', { horizontalLayout: 'full' })));
console.log(chalk.yellow('Initializing Professional Emotion Detection System...'));
console.log(chalk.cyan('Press ESC or Ctrl+C to exit\n'));

setTimeout(() => {
  new EmotionDetectionCLI();
}, 2000);