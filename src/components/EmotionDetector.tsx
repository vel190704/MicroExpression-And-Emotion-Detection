import React, { useRef, useEffect, useState } from 'react';
import { Camera, Square, Play, Pause, AlertTriangle, Shield, Database, RefreshCw } from 'lucide-react';
import AudioAnalyzer from './AudioAnalyzer';

interface EmotionResult {
  id: string;
  timestamp: string;
  emotion: string;
  confidence: number;
  sessionId: string;
}

interface VoiceAnalysis {
  id: string;
  timestamp: string;
  stressLevel: number;
  confidenceLevel: number;
  pitchVariation: number;
  speechRate: number;
  volumeConsistency: number;
  emotionalState: 'calm' | 'stressed' | 'confident' | 'uncertain' | 'deceptive' | 'anxious';
  sessionId: string;
}

interface EmotionDetectorProps {
  onEmotionDetected: (result: EmotionResult) => void;
  onVoiceAnalyzed?: (result: VoiceAnalysis) => void;
}

const EmotionDetector: React.FC<EmotionDetectorProps> = ({ onEmotionDetected, onVoiceAnalyzed }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  
  const [isRecording, setIsRecording] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [confidence, setConfidence] = useState<number>(0);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [hasConsent, setHasConsent] = useState(false);
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [videoReady, setVideoReady] = useState(false);

  // Mock emotion detection
  const detectEmotion = (): { emotion: string; confidence: number } => {
    const emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const randomConfidence = Math.random() * 0.4 + 0.6;
    return { emotion: randomEmotion, confidence: randomConfidence };
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind, track.label);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
    
    setCameraState('idle');
    setIsRecording(false);
    setVideoReady(false);
  };

  const drawVideoToCanvas = () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas (mirrored)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    
    if (isRecording) {
      animationRef.current = requestAnimationFrame(drawVideoToCanvas);
    }
  };

  const initializeCamera = async () => {
    try {
      setCameraState('requesting');
      setErrorMessage('');
      setVideoReady(false);
      
      // Stop any existing stream
      stopCamera();

      console.log('Requesting camera access...');
      
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      console.log('Camera stream obtained:', stream);
      console.log('Video tracks:', stream.getVideoTracks().map(t => ({
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        settings: t.getSettings()
      })));

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set up video element
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        // Handle video events
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            duration: video.duration,
            readyState: video.readyState
          });
          
          // Set canvas size
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          
          setVideoReady(true);
        };
        
        const handleCanPlay = async () => {
          console.log('Video can play');
          try {
            await video.play();
            console.log('Video playing successfully');
            setCameraState('active');
            
            // Start drawing to canvas
            drawVideoToCanvas();
          } catch (error) {
            console.error('Error playing video:', error);
            setErrorMessage('Failed to start video playback');
            setCameraState('error');
          }
        };
        
        const handleError = (error: any) => {
          console.error('Video error:', error);
          setErrorMessage('Video playback error');
          setCameraState('error');
        };
        
        // Add event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleError);
        
        // Cleanup function
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('error', handleError);
        };
        
        // Store cleanup function for later use
        (video as any)._cleanup = cleanup;
        
        // Force load if already ready
        if (video.readyState >= 1) {
          handleLoadedMetadata();
        }
        if (video.readyState >= 3) {
          handleCanPlay();
        }
      }

    } catch (error: any) {
      console.error('Camera initialization error:', error);
      setCameraState('error');
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Camera access denied. Please allow camera permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        setErrorMessage('No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotReadableError') {
        setErrorMessage('Camera is being used by another application. Please close other apps and try again.');
      } else {
        setErrorMessage(`Camera error: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const processFrame = () => {
    if (!isRecording || cameraState !== 'active') return;

    const result = detectEmotion();
    setCurrentEmotion(result.emotion);
    setConfidence(result.confidence);

    const emotionResult: EmotionResult = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      emotion: result.emotion,
      confidence: result.confidence,
      sessionId
    };

    onEmotionDetected(emotionResult);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && cameraState === 'active') {
      interval = setInterval(processFrame, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, cameraState]);

  useEffect(() => {
    if (isRecording && videoReady) {
      drawVideoToCanvas();
    }
  }, [isRecording, videoReady]);

  const toggleRecording = () => {
    if (cameraState !== 'active') return;
    setIsRecording(!isRecording);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (videoRef.current && (videoRef.current as any)._cleanup) {
        (videoRef.current as any)._cleanup();
      }
    };
  }, []);

  const handleConsentAndStart = () => {
    setHasConsent(true);
    initializeCamera();
  };

  const handleVoiceAnalyzed = (result: VoiceAnalysis) => {
    if (onVoiceAnalyzed) {
      onVoiceAnalyzed(result);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Camera className="mr-2" />
            Emotion Detection System
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              cameraState === 'active' && isRecording ? 'bg-red-500 animate-pulse' : 
              cameraState === 'active' ? 'bg-green-500' : 
              'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600">
              {cameraState === 'active' && isRecording ? 'Recording' : 
               cameraState === 'active' ? 'Camera Active' :
               cameraState === 'requesting' ? 'Requesting...' :
               'Stopped'}
            </span>
          </div>
        </div>

        {!hasConsent && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Legal Authorization Required</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  This system processes facial micro-expressions for AI-assisted analysis. 
                  Do you have legal authority and subject consent to proceed?
                </p>
                <button
                  onClick={handleConsentAndStart}
                  className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700"
                >
                  I Confirm Legal Authority & Consent
                </button>
              </div>
            </div>
          </div>
        )}

        {hasConsent && cameraState === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Camera Error</h3>
                <p className="text-red-700 text-sm mb-3">{errorMessage}</p>
                <div className="space-x-2">
                  <button
                    onClick={initializeCamera}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 inline-flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Retry Camera
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative mb-4">
          {/* Hidden video element for stream capture */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
          />
          
          {/* Canvas for displaying video feed */}
          <canvas
            ref={canvasRef}
            className={`w-full h-64 rounded-lg object-cover border-2 ${
              cameraState === 'active' ? 'border-green-500' : 'border-gray-300'
            }`}
            style={{ 
              backgroundColor: '#1f2937',
              minHeight: '256px',
              maxHeight: '400px'
            }}
          />
          
          {cameraState === 'requesting' && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                <p className="text-lg">Requesting camera access...</p>
                <p className="text-sm text-gray-300 mt-2">Please allow camera permissions</p>
              </div>
            </div>
          )}
          
          {cameraState === 'idle' && hasConsent && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <button
                  onClick={initializeCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Camera
                </button>
              </div>
            </div>
          )}
          
          {!hasConsent && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Shield className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg">Camera Access Required</p>
                <p className="text-sm text-gray-300 mt-2">Please provide consent to continue</p>
              </div>
            </div>
          )}
          
          {cameraState === 'active' && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <button
                onClick={toggleRecording}
                className={`flex items-center px-4 py-2 rounded-lg text-white font-medium ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRecording ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isRecording ? 'Stop' : 'Start'} Analysis
              </button>
              
              <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded">
                Session: {sessionId.slice(-8)}
              </div>
            </div>
          )}
        </div>

        {hasConsent && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Current Emotion</div>
              <div className="text-lg font-semibold capitalize text-gray-800">
                {currentEmotion}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Confidence Score</div>
              <div className="text-lg font-semibold text-gray-800">
                {(confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {hasConsent && cameraState === 'active' && videoReady && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-green-700">Camera is active and video feed is working</span>
            </div>
          </div>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
            <div className="text-sm text-red-700">
              <strong>⚠️ AI predictions shown are not legally admissible.</strong> Use only for analysis assistance. 
              Results have accuracy limitations and should not be used as conclusive evidence.
            </div>
          </div>
        </div>
      </div>
      
      {hasConsent && (
        <AudioAnalyzer 
          onVoiceAnalyzed={handleVoiceAnalyzed}
          sessionId={sessionId}
          isActive={isRecording}
        />
      )}
    </div>
  );
};

export default EmotionDetector;