import React, { useState, useEffect } from 'react';
import { Database, Download, Trash2, Eye, Shield } from 'lucide-react';

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

interface DataLoggerProps {
  data: EmotionResult[];
  voiceData: VoiceAnalysis[];
  onClearData: () => void;
}

const DataLogger: React.FC<DataLoggerProps> = ({ data, voiceData, onClearData }) => {
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [filteredData, setFilteredData] = useState<EmotionResult[]>([]);
  const [filteredVoiceData, setFilteredVoiceData] = useState<VoiceAnalysis[]>([]);
  const [activeDataType, setActiveDataType] = useState<'emotion' | 'voice' | 'combined'>('combined');

  const sessions = Array.from(new Set([...data.map(item => item.sessionId), ...voiceData.map(item => item.sessionId)]));

  useEffect(() => {
    if (selectedSession === 'all') {
      setFilteredData(data);
      setFilteredVoiceData(voiceData);
    } else {
      setFilteredData(data.filter(item => item.sessionId === selectedSession));
      setFilteredVoiceData(voiceData.filter(item => item.sessionId === selectedSession));
    }
  }, [data, voiceData, selectedSession]);

  const exportData = () => {
    let csvContent = '';
    
    if (activeDataType === 'emotion' || activeDataType === 'combined') {
      csvContent += 'Type,Timestamp,Session ID,Emotion,Confidence,Notes\n';
      csvContent += filteredData.map(item => 
        `Emotion,${item.timestamp},${item.sessionId},${item.emotion},${(item.confidence * 100).toFixed(1)}%,Non-evidence data`
      ).join('\n');
    }
    
    if (activeDataType === 'voice' || activeDataType === 'combined') {
      if (csvContent) csvContent += '\n';
      if (activeDataType === 'voice') {
        csvContent += 'Type,Timestamp,Session ID,Emotional State,Stress Level,Confidence Level,Pitch Variation,Speech Rate,Volume Consistency,Notes\n';
      }
      csvContent += filteredVoiceData.map(item => 
        `Voice,${item.timestamp},${item.sessionId},${item.emotionalState},${(item.stressLevel * 100).toFixed(1)}%,${(item.confidenceLevel * 100).toFixed(1)}%,${(item.pitchVariation * 100).toFixed(1)}%,${(item.speechRate * 100).toFixed(1)}%,${(item.volumeConsistency * 100).toFixed(1)}%,Non-evidence data`
      ).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multimodal_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: 'text-green-600 bg-green-50',
      sad: 'text-blue-600 bg-blue-50',
      angry: 'text-red-600 bg-red-50',
      fearful: 'text-purple-600 bg-purple-50',
      surprised: 'text-yellow-600 bg-yellow-50',
      disgusted: 'text-orange-600 bg-orange-50',
      neutral: 'text-gray-600 bg-gray-50'
    };
    return colors[emotion] || 'text-gray-600 bg-gray-50';
  };

  const getVoiceStateColor = (state: string) => {
    const colors: { [key: string]: string } = {
      calm: 'text-green-600 bg-green-50',
      confident: 'text-blue-600 bg-blue-50',
      stressed: 'text-red-600 bg-red-50',
      anxious: 'text-orange-600 bg-orange-50',
      uncertain: 'text-yellow-600 bg-yellow-50',
      deceptive: 'text-purple-600 bg-purple-50'
    };
    return colors[state] || 'text-gray-600 bg-gray-50';
  };

  const emotionStats = filteredData.reduce((acc, item) => {
    acc[item.emotion] = (acc[item.emotion] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const voiceStats = filteredVoiceData.reduce((acc, item) => {
    acc[item.emotionalState] = (acc[item.emotionalState] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Database className="mr-2" />
          Multimodal Analysis Logs
        </h2>
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600">Secured & Anonymized</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <select
            value={activeDataType}
            onChange={(e) => setActiveDataType(e.target.value as any)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="combined">Combined Data</option>
            <option value="emotion">Emotion Only</option>
            <option value="voice">Voice Only</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="all">All Sessions</option>
            {sessions.map(session => (
              <option key={session} value={session}>
                {session.slice(-8)}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            {activeDataType === 'emotion' ? filteredData.length :
             activeDataType === 'voice' ? filteredVoiceData.length :
             filteredData.length + filteredVoiceData.length} records
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={exportData}
            disabled={filteredData.length === 0 && filteredVoiceData.length === 0}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </button>
          <button
            onClick={onClearData}
            className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </button>
        </div>
      </div>

      {(Object.keys(emotionStats).length > 0 || Object.keys(voiceStats).length > 0) && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Analysis Distribution</h3>
          <div className="grid grid-cols-6 gap-2">
            {(activeDataType === 'emotion' || activeDataType === 'combined') && 
            Object.entries(emotionStats).map(([emotion, count]) => (
              <div key={emotion} className="text-center">
                <div className={`px-2 py-1 rounded text-sm font-medium ${getEmotionColor(emotion)}`}>
                  {emotion}
                </div>
                <div className="text-xs text-gray-600 mt-1">{count}</div>
              </div>
            ))}
            {(activeDataType === 'voice' || activeDataType === 'combined') && 
            Object.entries(voiceStats).map(([state, count]) => (
              <div key={state} className="text-center">
                <div className={`px-2 py-1 rounded text-sm font-medium ${getVoiceStateColor(state)}`}>
                  {state}
                </div>
                <div className="text-xs text-gray-600 mt-1">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto">
        {filteredData.length === 0 && filteredVoiceData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No analysis data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Combine and display data based on selection */}
            {(() => {
              let combinedData: any[] = [];
              
              if (activeDataType === 'emotion' || activeDataType === 'combined') {
                combinedData = [...combinedData, ...filteredData.map(item => ({...item, type: 'emotion'}))];
              }
              
              if (activeDataType === 'voice' || activeDataType === 'combined') {
                combinedData = [...combinedData, ...filteredVoiceData.map(item => ({...item, type: 'voice'}))];
              }
              
              return combinedData
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                  {item.type === 'emotion' ? (
                    <>
                      <div className={`px-2 py-1 rounded text-sm font-medium ${getEmotionColor(item.emotion)}`}>
                        {item.emotion}
                      </div>
                      <div className="text-sm text-gray-600">
                        {(item.confidence * 100).toFixed(1)}% confidence
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`px-2 py-1 rounded text-sm font-medium ${getVoiceStateColor(item.emotionalState)}`}>
                        {item.emotionalState}
                      </div>
                      <div className="text-sm text-gray-600">
                        Stress: {(item.stressLevel * 100).toFixed(1)}% | Conf: {(item.confidenceLevel * 100).toFixed(1)}%
                      </div>
                    </>
                  )}
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {item.type === 'emotion' ? 'Visual' : 'Voice'}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {item.sessionId.slice(-8)}
                </div>
              </div>
              ));
            })()}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-700">
          <strong>Multimodal Analysis:</strong> Combines visual emotion detection with voice stress analysis. 
          All data processed locally, anonymized, and marked as "non-evidence\" for legal compliance.
        </div>
      </div>
    </div>
  );
};

export default DataLogger;