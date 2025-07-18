import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

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

interface AudioAnalyzerProps {
  onVoiceAnalyzed: (result: VoiceAnalysis) => void;
  sessionId: string;
  isActive: boolean;
}

const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({ onVoiceAnalyzed, sessionId, isActive }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<VoiceAnalysis | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [audioError, setAudioError] = useState<string>('');
  
  // Voice analysis history for pattern detection
  const [voiceHistory, setVoiceHistory] = useState<number[]>([]);
  const [pitchHistory, setPitchHistory] = useState<number[]>([]);
  const [volumeHistory, setVolumeHistory] = useState<number[]>([]);

  const initializeAudio = async () => {
    try {
      setAudioError('');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Create analyser node
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Connect microphone to analyser
      microphoneRef.current = audioContext.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      
      setHasAudioPermission(true);
      setIsListening(true);
      
      // Start analysis loop
      analyzeAudio();
      
    } catch (error: any) {
      console.error('Audio initialization error:', error);
      setAudioError(error.message || 'Failed to access microphone');
      setHasAudioPermission(false);
    }
  };

  const stopAudio = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsListening(false);
    setAudioLevel(0);
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !isActive) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Float32Array(bufferLength);
    
    analyserRef.current.getByteFrequencyData(dataArray);
    analyserRef.current.getFloatFrequencyData(frequencyData);
    
    // Calculate audio level (0-100)
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const audioLevel = Math.round((average / 255) * 100);
    setAudioLevel(audioLevel);
    
    // Only analyze if there's significant audio input
    if (audioLevel > 5) {
      performVoiceStressAnalysis(dataArray, frequencyData, audioLevel);
    }
    
    animationRef.current = requestAnimationFrame(analyzeAudio);
  };

  const performVoiceStressAnalysis = (timeData: Uint8Array, frequencyData: Float32Array, volume: number) => {
    // Fundamental frequency analysis (pitch detection)
    const fundamentalFreq = detectFundamentalFrequency(frequencyData);
    
    // Voice stress indicators
    const highFreqEnergy = calculateHighFrequencyEnergy(frequencyData);
    const spectralCentroid = calculateSpectralCentroid(frequencyData);
    const jitter = calculateJitter(pitchHistory, fundamentalFreq);
    const shimmer = calculateShimmer(volumeHistory, volume);
    
    // Update history
    setVoiceHistory(prev => [...prev.slice(-19), volume]);
    setPitchHistory(prev => [...prev.slice(-19), fundamentalFreq]);
    setVolumeHistory(prev => [...prev.slice(-19), volume]);
    
    // Calculate stress indicators
    const stressLevel = calculateStressLevel(highFreqEnergy, jitter, shimmer, spectralCentroid);
    const confidenceLevel = calculateConfidenceLevel(volume, jitter, shimmer);
    const pitchVariation = calculatePitchVariation(pitchHistory);
    const speechRate = calculateSpeechRate(voiceHistory);
    const volumeConsistency = calculateVolumeConsistency(volumeHistory);
    
    // Determine emotional state
    const emotionalState = determineEmotionalState(stressLevel, confidenceLevel, pitchVariation, speechRate);
    
    const analysis: VoiceAnalysis = {
      id: `voice_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      stressLevel,
      confidenceLevel,
      pitchVariation,
      speechRate,
      volumeConsistency,
      emotionalState,
      sessionId
    };
    
    setCurrentAnalysis(analysis);
    onVoiceAnalyzed(analysis);
  };

  const detectFundamentalFrequency = (frequencyData: Float32Array): number => {
    let maxIndex = 0;
    let maxValue = -Infinity;
    
    // Look for peak in typical human voice range (80-300 Hz)
    const startIndex = Math.floor(80 * frequencyData.length / 22050);
    const endIndex = Math.floor(300 * frequencyData.length / 22050);
    
    for (let i = startIndex; i < endIndex && i < frequencyData.length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }
    
    return (maxIndex * 22050) / frequencyData.length;
  };

  const calculateHighFrequencyEnergy = (frequencyData: Float32Array): number => {
    const highFreqStart = Math.floor(frequencyData.length * 0.6);
    let energy = 0;
    
    for (let i = highFreqStart; i < frequencyData.length; i++) {
      energy += Math.pow(10, frequencyData[i] / 10);
    }
    
    return Math.min(energy / (frequencyData.length - highFreqStart), 1);
  };

  const calculateSpectralCentroid = (frequencyData: Float32Array): number => {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.pow(10, frequencyData[i] / 10);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  };

  const calculateJitter = (pitchHistory: number[], currentPitch: number): number => {
    if (pitchHistory.length < 3) return 0;
    
    const recent = [...pitchHistory.slice(-5), currentPitch];
    let jitterSum = 0;
    
    for (let i = 1; i < recent.length; i++) {
      jitterSum += Math.abs(recent[i] - recent[i-1]);
    }
    
    return Math.min(jitterSum / (recent.length - 1) / 100, 1);
  };

  const calculateShimmer = (volumeHistory: number[], currentVolume: number): number => {
    if (volumeHistory.length < 3) return 0;
    
    const recent = [...volumeHistory.slice(-5), currentVolume];
    let shimmerSum = 0;
    
    for (let i = 1; i < recent.length; i++) {
      shimmerSum += Math.abs(recent[i] - recent[i-1]);
    }
    
    return Math.min(shimmerSum / (recent.length - 1) / 50, 1);
  };

  const calculateStressLevel = (highFreqEnergy: number, jitter: number, shimmer: number, spectralCentroid: number): number => {
    // Stress indicators: high frequency energy, voice tremor (jitter/shimmer), spectral changes
    const stressScore = (
      highFreqEnergy * 0.3 +
      jitter * 0.25 +
      shimmer * 0.25 +
      (spectralCentroid > 0.6 ? 0.2 : 0)
    );
    
    return Math.min(Math.max(stressScore, 0), 1);
  };

  const calculateConfidenceLevel = (volume: number, jitter: number, shimmer: number): number => {
    // Confident speech: steady volume, low jitter/shimmer, appropriate volume
    const volumeScore = volume > 20 && volume < 80 ? 0.4 : 0.2;
    const stabilityScore = (1 - jitter) * 0.3 + (1 - shimmer) * 0.3;
    
    return Math.min(Math.max(volumeScore + stabilityScore, 0), 1);
  };

  const calculatePitchVariation = (pitchHistory: number[]): number => {
    if (pitchHistory.length < 5) return 0;
    
    const mean = pitchHistory.reduce((sum, val) => sum + val, 0) / pitchHistory.length;
    const variance = pitchHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pitchHistory.length;
    
    return Math.min(Math.sqrt(variance) / 100, 1);
  };

  const calculateSpeechRate = (voiceHistory: number[]): number => {
    if (voiceHistory.length < 10) return 0.5;
    
    // Count speech segments (volume above threshold)
    const speechSegments = voiceHistory.filter(vol => vol > 10).length;
    return Math.min(speechSegments / voiceHistory.length, 1);
  };

  const calculateVolumeConsistency = (volumeHistory: number[]): number => {
    if (volumeHistory.length < 5) return 1;
    
    const mean = volumeHistory.reduce((sum, val) => sum + val, 0) / volumeHistory.length;
    const variance = volumeHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / volumeHistory.length;
    
    return Math.max(1 - (Math.sqrt(variance) / 50), 0);
  };

  const determineEmotionalState = (stress: number, confidence: number, pitchVar: number, speechRate: number): VoiceAnalysis['emotionalState'] => {
    if (stress > 0.7) return 'stressed';
    if (confidence > 0.7 && stress < 0.3) return 'confident';
    if (pitchVar > 0.6 && speechRate < 0.4) return 'uncertain';
    if (stress > 0.5 && pitchVar > 0.5) return 'anxious';
    if (stress > 0.4 && confidence < 0.4 && pitchVar > 0.4) return 'deceptive';
    return 'calm';
  };

  useEffect(() => {
    if (isActive && hasAudioPermission && isListening) {
      analyzeAudio();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, hasAudioPermission, isListening]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const getStateColor = (state: string) => {
    const colors = {
      calm: 'text-green-600 bg-green-50',
      confident: 'text-blue-600 bg-blue-50',
      stressed: 'text-red-600 bg-red-50',
      anxious: 'text-orange-600 bg-orange-50',
      uncertain: 'text-yellow-600 bg-yellow-50',
      deceptive: 'text-purple-600 bg-purple-50'
    };
    return colors[state as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Activity className="mr-2" />
          Voice Stress Analysis
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isListening ? 'Analyzing' : 'Stopped'}
          </span>
        </div>
      </div>

      {!hasAudioPermission && (
        <div className="mb-4">
          <button
            onClick={initializeAudio}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <Mic className="w-5 h-5 mr-2" />
            Enable Voice Analysis
          </button>
          {audioError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{audioError}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {hasAudioPermission && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Audio Level</span>
              <span className="text-sm font-medium">{audioLevel}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-100 ${
                  audioLevel > 70 ? 'bg-red-500' : 
                  audioLevel > 40 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${audioLevel}%` }}
              ></div>
            </div>
          </div>

          {currentAnalysis && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Stress Level</div>
                  <div className="flex items-center">
                    <div className="text-lg font-semibold text-gray-800">
                      {(currentAnalysis.stressLevel * 100).toFixed(1)}%
                    </div>
                    <div className={`ml-2 w-2 h-2 rounded-full ${
                      currentAnalysis.stressLevel > 0.7 ? 'bg-red-500' :
                      currentAnalysis.stressLevel > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Confidence</div>
                  <div className="flex items-center">
                    <div className="text-lg font-semibold text-gray-800">
                      {(currentAnalysis.confidenceLevel * 100).toFixed(1)}%
                    </div>
                    <TrendingUp className={`ml-2 w-4 h-4 ${
                      currentAnalysis.confidenceLevel > 0.6 ? 'text-green-500' : 'text-gray-400'
                    }`} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-2">Emotional State</div>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStateColor(currentAnalysis.emotionalState)}`}>
                  {currentAnalysis.emotionalState.charAt(0).toUpperCase() + currentAnalysis.emotionalState.slice(1)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-600">Pitch Variation</div>
                  <div className="font-semibold">{(currentAnalysis.pitchVariation * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Speech Rate</div>
                  <div className="font-semibold">{(currentAnalysis.speechRate * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Consistency</div>
                  <div className="font-semibold">{(currentAnalysis.volumeConsistency * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <button
              onClick={isListening ? stopAudio : initializeAudio}
              className={`flex items-center px-4 py-2 rounded-lg text-white font-medium ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
              {isListening ? 'Stop Analysis' : 'Start Analysis'}
            </button>
          </div>
        </>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-700">
          <strong>Voice Stress Analysis:</strong> Analyzes vocal patterns including pitch variation, 
          speech rate, and frequency distribution to detect stress indicators similar to voice stress analysis used in polygraph testing.
        </div>
      </div>
    </div>
  );
};

export default AudioAnalyzer;