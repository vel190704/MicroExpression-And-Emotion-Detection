import React, { useState } from 'react';
import { BarChart3, TrendingUp, Clock, Users, Brain, Eye, AlertTriangle, Target, Activity } from 'lucide-react';

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

interface DashboardProps {
  data: EmotionResult[];
  voiceData: VoiceAnalysis[];
}

const Dashboard: React.FC<DashboardProps> = ({ data, voiceData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'patterns' | 'insights'>('overview');
  
  const totalSessions = new Set(data.map(item => item.sessionId)).size;
  const averageConfidence = data.length > 0 
    ? data.reduce((sum, item) => sum + item.confidence, 0) / data.length 
    : 0;

  const averageStressLevel = voiceData.length > 0
    ? voiceData.reduce((sum, item) => sum + item.stressLevel, 0) / voiceData.length
    : 0;

  const averageVoiceConfidence = voiceData.length > 0
    ? voiceData.reduce((sum, item) => sum + item.confidenceLevel, 0) / voiceData.length
    : 0;

  const recentData = data.slice(-10);
  const recentVoiceData = voiceData.slice(-10);
  const emotionCounts = data.reduce((acc, item) => {
    acc[item.emotion] = (acc[item.emotion] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const voiceStateCounts = voiceData.reduce((acc, item) => {
    acc[item.emotionalState] = (acc[item.emotionalState] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const mostCommonEmotion = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

  const mostCommonVoiceState = Object.entries(voiceStateCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'calm';

  // Emotion-to-Thought Analysis Data
  const emotionToThoughtMapping = {
    fear: {
      microExpression: 'Eye widening',
      thoughtInference: 'Hiding something, worried about exposure',
      riskLevel: 'high',
      indicators: ['Rapid blinking', 'Pupil dilation', 'Eyebrow flash']
    },
    disgusted: {
      microExpression: 'Nose wrinkle',
      thoughtInference: 'Rejecting idea, disagreeing internally',
      riskLevel: 'medium',
      indicators: ['Upper lip raise', 'Nostril flare', 'Mouth corner down']
    },
    contempt: {
      microExpression: 'Half-smile/sneer',
      thoughtInference: "Believes they're smarter, dismissive",
      riskLevel: 'high',
      indicators: ['Unilateral lip corner raise', 'Eye roll', 'Head tilt back']
    },
    guilt: {
      microExpression: 'Downward gaze, sigh',
      thoughtInference: 'Regret or knowledge of wrongdoing',
      riskLevel: 'very-high',
      indicators: ['Shoulder shrug', 'Hand to face', 'Lip compression']
    },
    angry: {
      microExpression: 'Brow tension, jaw clench',
      thoughtInference: 'Defensive, frustrated, possibly lying',
      riskLevel: 'high',
      indicators: ['Furrowed brow', 'Tight lips', 'Nostril flare']
    },
    surprised: {
      microExpression: 'Eyebrow raise, mouth open',
      thoughtInference: 'Unexpected question, caught off guard',
      riskLevel: 'medium',
      indicators: ['Wide eyes', 'Dropped jaw', 'Forehead wrinkles']
    },
    happy: {
      microExpression: 'Genuine smile, eye crinkles',
      thoughtInference: 'Confident, truthful, comfortable',
      riskLevel: 'low',
      indicators: ['Duchenne smile', 'Eye crinkles', 'Raised cheeks']
    },
    sad: {
      microExpression: 'Lip corner down, brow furrow',
      thoughtInference: 'Remorse, disappointment, emotional stress',
      riskLevel: 'medium',
      indicators: ['Drooping eyelids', 'Lip tremor', 'Chin raise']
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: 'bg-green-500',
      sad: 'bg-blue-500',
      angry: 'bg-red-500',
      fearful: 'bg-purple-500',
      fear: 'bg-purple-500',
      surprised: 'bg-yellow-500',
      disgusted: 'bg-orange-500',
      contempt: 'bg-red-600',
      guilt: 'bg-red-700',
      neutral: 'bg-gray-500'
    };
    return colors[emotion] || 'bg-gray-500';
  };

  const getVoiceStateColor = (state: string) => {
    const colors: { [key: string]: string } = {
      calm: 'bg-green-500',
      confident: 'bg-blue-500',
      stressed: 'bg-red-500',
      anxious: 'bg-orange-500',
      uncertain: 'bg-yellow-500',
      deceptive: 'bg-purple-500'
    };
    return colors[state] || 'bg-gray-500';
  };

  const getRiskLevelColor = (level: string) => {
    const colors = {
      'low': 'text-green-600 bg-green-50',
      'medium': 'text-yellow-600 bg-yellow-50',
      'high': 'text-orange-600 bg-orange-50',
      'very-high': 'text-red-600 bg-red-50'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const calculateDeceptionRisk = () => {
    const recentEmotions = data.slice(-5);
    const recentVoice = voiceData.slice(-3);
    
    let riskScore = 0;
    let factors = [];

    // Analyze recent emotions
    const highRiskEmotions = recentEmotions.filter(e => 
      ['fear', 'guilt', 'contempt', 'angry'].includes(e.emotion)
    );
    if (highRiskEmotions.length > 2) {
      riskScore += 30;
      factors.push('Multiple stress emotions detected');
    }

    // Analyze voice patterns
    const highStress = recentVoice.filter(v => v.stressLevel > 0.7);
    if (highStress.length > 1) {
      riskScore += 25;
      factors.push('Elevated voice stress patterns');
    }

    const deceptiveVoice = recentVoice.filter(v => v.emotionalState === 'deceptive');
    if (deceptiveVoice.length > 0) {
      riskScore += 35;
      factors.push('Deceptive voice patterns detected');
    }

    // Low confidence patterns
    const lowConfidence = recentVoice.filter(v => v.confidenceLevel < 0.4);
    if (lowConfidence.length > 1) {
      riskScore += 20;
      factors.push('Low confidence indicators');
    }

    return { riskScore: Math.min(riskScore, 100), factors };
  };

  const deceptionAnalysis = calculateDeceptionRisk();

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'analysis', label: 'Thought Analysis', icon: Brain },
            { id: 'patterns', label: 'Behavior Patterns', icon: Activity },
            { id: 'insights', label: 'Risk Assessment', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">{data.length}</div>
                  <div className="text-sm text-gray-600">Total Detections</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">{totalSessions}</div>
                  <div className="text-sm text-gray-600">Active Sessions</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {(averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-800 capitalize">{mostCommonEmotion}</div>
                  <div className="text-sm text-gray-600">Most Common</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {(averageStressLevel * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Stress</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">{deceptionAnalysis.riskScore}%</div>
                  <div className="text-sm text-gray-600">Risk Score</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Emotion Distribution</h3>
              <div className="space-y-3">
                {Object.entries(emotionCounts).map(([emotion, count]) => {
                  const percentage = data.length > 0 ? (count / data.length) * 100 : 0;
                  return (
                    <div key={emotion} className="flex items-center">
                      <div className="w-20 text-sm text-gray-600 capitalize">{emotion}</div>
                      <div className="flex-1 mx-3">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getEmotionColor(emotion)}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Voice State Distribution</h3>
              <div className="space-y-3">
                {Object.entries(voiceStateCounts).map(([state, count]) => {
                  const percentage = voiceData.length > 0 ? (count / voiceData.length) * 100 : 0;
                  return (
                    <div key={state} className="flex items-center">
                      <div className="w-20 text-sm text-gray-600 capitalize">{state}</div>
                      <div className="flex-1 mx-3">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getVoiceStateColor(state)}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {[...recentData.map(item => ({...item, type: 'emotion'})), ...recentVoiceData.map(item => ({...item, type: 'voice'}))]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 8)
                  .map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      {item.type === 'emotion' ? (
                        <>
                          <div className={`w-3 h-3 rounded-full ${getEmotionColor((item as any).emotion)}`}></div>
                          <span className="text-sm text-gray-800 capitalize">{(item as any).emotion}</span>
                        </>
                      ) : (
                        <>
                          <div className={`w-3 h-3 rounded-full ${getVoiceStateColor((item as any).emotionalState)}`}></div>
                          <span className="text-sm text-gray-800 capitalize">{(item as any).emotionalState}</span>
                        </>
                      )}
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {item.type === 'emotion' ? 'Visual' : 'Voice'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {recentData.length === 0 && recentVoiceData.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Thought Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Brain className="mr-3 text-blue-600" />
              Real-Time Emotion-to-Thought Examples
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 font-semibold text-gray-700 border-b">Emotion</th>
                    <th className="text-left p-4 font-semibold text-gray-700 border-b">Micro-Expression</th>
                    <th className="text-left p-4 font-semibold text-gray-700 border-b">Possible Thought Inference</th>
                    <th className="text-left p-4 font-semibold text-gray-700 border-b">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(emotionToThoughtMapping).map(([emotion, data]) => (
                    <tr key={emotion} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 border-b">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${getEmotionColor(emotion)}`}></div>
                          <span className="font-medium capitalize">{emotion}</span>
                        </div>
                      </td>
                      <td className="p-4 border-b text-gray-700">{data.microExpression}</td>
                      <td className="p-4 border-b text-gray-700">{data.thoughtInference}</td>
                      <td className="p-4 border-b">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(data.riskLevel)}`}>
                          {data.riskLevel.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Eye className="mr-2 text-purple-600" />
              Current Session Analysis
            </h3>
            
            {data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Detected Emotions & Inferences</h4>
                  <div className="space-y-3">
                    {Object.entries(emotionCounts).map(([emotion, count]) => {
                      const mapping = emotionToThoughtMapping[emotion as keyof typeof emotionToThoughtMapping];
                      if (!mapping) return null;
                      
                      return (
                        <div key={emotion} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">{emotion}</span>
                            <span className="text-sm text-gray-600">{count} times</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{mapping.thoughtInference}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{mapping.microExpression}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(mapping.riskLevel)}`}>
                              {mapping.riskLevel.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Micro-Expression Indicators</h4>
                  <div className="space-y-3">
                    {Object.entries(emotionCounts).map(([emotion, count]) => {
                      const mapping = emotionToThoughtMapping[emotion as keyof typeof emotionToThoughtMapping];
                      if (!mapping) return null;
                      
                      return (
                        <div key={emotion} className="p-3 border border-gray-200 rounded-lg">
                          <div className="font-medium capitalize mb-2">{emotion}</div>
                          <div className="space-y-1">
                            {mapping.indicators.map((indicator, index) => (
                              <div key={index} className="flex items-center text-sm text-gray-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                {indicator}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No emotion data available for analysis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Behavior Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Emotional Patterns</h3>
              <div className="space-y-4">
                {data.slice(-10).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-500 mr-3">#{index + 1}</div>
                      <div className={`w-3 h-3 rounded-full mr-3 ${getEmotionColor(item.emotion)}`}></div>
                      <span className="font-medium capitalize">{item.emotion}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {(item.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Voice Patterns</h3>
              <div className="space-y-4">
                {voiceData.slice(-10).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-500 mr-3">#{index + 1}</div>
                      <div className={`w-3 h-3 rounded-full mr-3 ${getVoiceStateColor(item.emotionalState)}`}></div>
                      <span className="font-medium capitalize">{item.emotionalState}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Stress: {(item.stressLevel * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Target className="mr-2 text-red-600" />
              Deception Risk Assessment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  deceptionAnalysis.riskScore > 70 ? 'text-red-600' :
                  deceptionAnalysis.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {deceptionAnalysis.riskScore}%
                </div>
                <div className="text-sm text-gray-600">Overall Risk Score</div>
              </div>
              
              <div className="col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Risk Factors Detected:</h4>
                <div className="space-y-2">
                  {deceptionAnalysis.factors.length > 0 ? (
                    deceptionAnalysis.factors.map((factor, index) => (
                      <div key={index} className="flex items-center p-2 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                        <span className="text-sm text-red-700">{factor}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center p-2 bg-green-50 rounded-lg">
                      <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
                      <span className="text-sm text-green-700">No significant risk factors detected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div className="text-sm text-red-700">
                <strong>Legal Disclaimer:</strong> This analysis is for research and training purposes only. 
                Risk assessments are algorithmic suggestions and should not be used as conclusive evidence 
                in legal proceedings. Always maintain human oversight and professional judgment.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;