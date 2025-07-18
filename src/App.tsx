import React, { useState } from 'react';
import { Shield, AlertTriangle, FileText } from 'lucide-react';
import EmotionDetector from './components/EmotionDetector';
import DataLogger from './components/DataLogger';
import Dashboard from './components/Dashboard';

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

function App() {
  const [emotionData, setEmotionData] = useState<EmotionResult[]>([]);
  const [voiceData, setVoiceData] = useState<VoiceAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState<'detector' | 'dashboard' | 'logs'>('detector');

  const handleEmotionDetected = (result: EmotionResult) => {
    setEmotionData(prev => [...prev, result]);
  };

  const handleVoiceAnalyzed = (result: VoiceAnalysis) => {
    setVoiceData(prev => [...prev, result]);
  };

  const clearData = () => {
    setEmotionData([]);
    setVoiceData([]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Professional Emotion Detection System
                </h1>
                <p className="text-sm text-gray-600">Research & Training Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-1" />
                Version 1.0 - Research Use Only
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Legal Disclaimer */}
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-sm text-red-700">
              <strong>Legal Notice:</strong> All predicted outputs in this system are intended as decision-support tools 
              and not to be used as conclusive evidence in legal proceedings. Data is processed locally, 
              secured via encryption, and anonymized for privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'detector', label: 'Live Detection', icon: Shield },
              { id: 'dashboard', label: 'Analytics Dashboard', icon: FileText },
              { id: 'logs', label: 'Data Logs', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'detector' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <EmotionDetector 
                onEmotionDetected={handleEmotionDetected}
                onVoiceAnalyzed={handleVoiceAnalyzed}
              />
            </div>
            <div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Guidelines</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                    <p>Ensure proper lighting for optimal detection accuracy</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                    <p>Subject should face camera directly</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                    <p>Results are suggestions only, not definitive</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                    <p>Always maintain human oversight</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Voice Analysis</h4>
                  <p className="text-sm text-purple-700">
                    Advanced vocal stress analysis detects micro-expressions in speech patterns, 
                    pitch variations, and confidence indicators similar to polygraph voice stress analysis.
                  </p>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Ethical Usage</h4>
                  <p className="text-sm text-yellow-700">
                    This system requires proper authorization and consent. 
                    Use only for legitimate research, training, or authorized analysis purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard data={emotionData} voiceData={voiceData} />
        )}

        {activeTab === 'logs' && (
          <DataLogger data={emotionData} voiceData={voiceData} onClearData={clearData} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              © 2025 Professional Emotion Detection System - Research & Training Use Only
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Data Privacy Compliant</span>
              <span>•</span>
              <span>GDPR/DPDP Aligned</span>
              <span>•</span>
              <span>Ethical AI Guidelines</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;