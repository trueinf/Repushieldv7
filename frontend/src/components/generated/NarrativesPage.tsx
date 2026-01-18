"use client";

import React, { useState, useEffect } from 'react';
import { Search, X as XIcon, TrendingUp, TrendingDown, Calendar, ChevronDown, Filter, AlertTriangle, Eye, MoreVertical, ChevronRight, Target, Layers, Zap, Clock, MapPin, Users, Activity, BookOpen, Lightbulb, Shield, FileText, ArrowUpRight, ArrowDownRight, Sparkles, CheckCircle, Bell, Ban, MessageSquare, BarChart2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { narrativesApi, Narrative } from '../../services/narrativesApi';
import { ConfigurationApi } from '../../services/configurationApi';

// Types
type NarrativeType = 'reputational' | 'political' | 'operational' | 'ethical' | 'safety' | 'misinformation';
type NarrativeStatus = 'emerging' | 'established' | 'entrenched' | 'declining';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type IntentSignal = 'organic' | 'opportunistic' | 'coordinated';
type SortOption = 'strength' | 'growth' | 'damage' | 'duration';
interface Narrative {
  id: string;
  title: string;
  type: NarrativeType;
  status: NarrativeStatus;
  summary: string;
  strengthScore: number;
  riskLevel: RiskLevel;
  intentSignal: IntentSignal;
  volumeOfMentions: number;
  persistenceDays: number;
  amplificationVelocity: number;
  affectedEntities: string[];
  platforms: {
    news: number;
    social: number;
    forums: number;
  };
  contributingTopics: number;
  reinforcingPosts: number;
  influencerInvolvement: boolean;
  firstEmergence: string;
  lastUpdated: string;
  confidence: number;
  trendData: number[];
  keyFrames: string[];
  geographicSpread: string[];
}

// Mock Data
const MOCK_NARRATIVES: Narrative[] = [{
  id: '1',
  title: 'Company prioritizes profit over customer safety',
  type: 'ethical',
  status: 'established',
  summary: 'A recurring framing across news and social media suggesting that cost-cutting decisions have compromised customer safety standards.',
  strengthScore: 87,
  riskLevel: 'critical',
  intentSignal: 'coordinated',
  volumeOfMentions: 12847,
  persistenceDays: 42,
  amplificationVelocity: 215,
  affectedEntities: ['Brand Reputation', 'Executive Team', 'Product Division'],
  platforms: {
    news: 45,
    social: 40,
    forums: 15
  },
  contributingTopics: 8,
  reinforcingPosts: 1247,
  influencerInvolvement: true,
  firstEmergence: '42 days ago',
  lastUpdated: '5m ago',
  confidence: 94,
  trendData: [45, 52, 58, 65, 70, 78, 87],
  keyFrames: ['profit over people', 'cutting corners', 'safety concerns ignored'],
  geographicSpread: ['North America', 'Europe', 'Asia-Pacific']
}, {
  id: '2',
  title: 'Leadership lacks transparency in crisis response',
  type: 'reputational',
  status: 'emerging',
  summary: 'Perception building that executive team is not being forthright about operational challenges and their potential impact.',
  strengthScore: 62,
  riskLevel: 'high',
  intentSignal: 'opportunistic',
  volumeOfMentions: 5421,
  persistenceDays: 14,
  amplificationVelocity: 142,
  affectedEntities: ['C-Suite', 'Communications Team', 'Investor Relations'],
  platforms: {
    news: 35,
    social: 50,
    forums: 15
  },
  contributingTopics: 5,
  reinforcingPosts: 687,
  influencerInvolvement: true,
  firstEmergence: '14 days ago',
  lastUpdated: '12m ago',
  confidence: 88,
  trendData: [20, 28, 35, 42, 50, 58, 62],
  keyFrames: ['lack of transparency', 'hiding the truth', 'silence speaks volumes'],
  geographicSpread: ['North America', 'Europe']
}, {
  id: '3',
  title: 'Innovation lagging behind market competitors',
  type: 'operational',
  status: 'established',
  summary: 'Industry analysts and customers increasingly frame the company as falling behind in technological innovation and product development.',
  strengthScore: 71,
  riskLevel: 'high',
  intentSignal: 'organic',
  volumeOfMentions: 8934,
  persistenceDays: 67,
  amplificationVelocity: 98,
  affectedEntities: ['Product Team', 'R&D Division', 'Market Position'],
  platforms: {
    news: 40,
    social: 35,
    forums: 25
  },
  contributingTopics: 12,
  reinforcingPosts: 1456,
  influencerInvolvement: false,
  firstEmergence: '67 days ago',
  lastUpdated: '28m ago',
  confidence: 91,
  trendData: [65, 68, 69, 70, 71, 71, 71],
  keyFrames: ['falling behind', 'outdated technology', 'competitors moving faster'],
  geographicSpread: ['Global']
}, {
  id: '4',
  title: 'Strong ESG commitment driving positive change',
  type: 'reputational',
  status: 'emerging',
  summary: 'Growing recognition of environmental and social governance initiatives positioning company as industry leader in sustainability.',
  strengthScore: 56,
  riskLevel: 'low',
  intentSignal: 'organic',
  volumeOfMentions: 3214,
  persistenceDays: 21,
  amplificationVelocity: 78,
  affectedEntities: ['Sustainability Team', 'Brand Image', 'Stakeholder Relations'],
  platforms: {
    news: 60,
    social: 30,
    forums: 10
  },
  contributingTopics: 6,
  reinforcingPosts: 423,
  influencerInvolvement: false,
  firstEmergence: '21 days ago',
  lastUpdated: '45m ago',
  confidence: 86,
  trendData: [20, 28, 35, 42, 48, 52, 56],
  keyFrames: ['leading by example', 'sustainable future', 'ESG excellence'],
  geographicSpread: ['Europe', 'North America']
}, {
  id: '5',
  title: 'Data privacy concerns escalating among users',
  type: 'safety',
  status: 'established',
  summary: 'Persistent narrative that company handles user data carelessly and prioritizes data monetization over privacy protection.',
  strengthScore: 79,
  riskLevel: 'critical',
  intentSignal: 'opportunistic',
  volumeOfMentions: 15621,
  persistenceDays: 89,
  amplificationVelocity: 187,
  affectedEntities: ['Security Team', 'Legal Department', 'User Trust', 'Regulatory Standing'],
  platforms: {
    news: 50,
    social: 40,
    forums: 10
  },
  contributingTopics: 9,
  reinforcingPosts: 2134,
  influencerInvolvement: true,
  firstEmergence: '89 days ago',
  lastUpdated: '8m ago',
  confidence: 96,
  trendData: [68, 72, 74, 76, 77, 78, 79],
  keyFrames: ['privacy invasion', 'data exploitation', 'can\'t be trusted'],
  geographicSpread: ['Europe', 'North America', 'Asia-Pacific']
}, {
  id: '6',
  title: 'Workplace culture promotes innovation and growth',
  type: 'reputational',
  status: 'declining',
  summary: 'Previously strong positive narrative about company culture showing signs of weakening amid recent workforce changes.',
  strengthScore: 48,
  riskLevel: 'medium',
  intentSignal: 'organic',
  volumeOfMentions: 2847,
  persistenceDays: 156,
  amplificationVelocity: -45,
  affectedEntities: ['HR Department', 'Employer Brand', 'Talent Acquisition'],
  platforms: {
    news: 25,
    social: 55,
    forums: 20
  },
  contributingTopics: 7,
  reinforcingPosts: 568,
  influencerInvolvement: false,
  firstEmergence: '156 days ago',
  lastUpdated: '1h ago',
  confidence: 82,
  trendData: [75, 68, 62, 58, 54, 50, 48],
  keyFrames: ['great place to work', 'innovation culture', 'employee-first'],
  geographicSpread: ['North America']
}];

// Type Badge Component
const TypeBadge = ({
  type
}: {
  type: NarrativeType;
}) => {
  const config = {
    reputational: {
      label: 'Reputational',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    political: {
      label: 'Political',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    operational: {
      label: 'Operational',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    ethical: {
      label: 'Ethical',
      color: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    safety: {
      label: 'Safety',
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    misinformation: {
      label: 'Misinfo',
      color: 'bg-red-50 text-red-700 border-red-200'
    }
  };
  const {
    label,
    color
  } = config[type];
  return <span className={cn('px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border', color)}>
      {label}
    </span>;
};

// Status Badge Component
const StatusBadge = ({
  status
}: {
  status: NarrativeStatus;
}) => {
  const config = {
    emerging: {
      label: 'Emerging',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Sparkles
    },
    established: {
      label: 'Established',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Target
    },
    entrenched: {
      label: 'Entrenched',
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: Layers
    },
    declining: {
      label: 'Declining',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: TrendingDown
    }
  };
  const {
    label,
    color,
    icon: Icon
  } = config[status];
  return <span className={cn('inline-flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border', color)}>
      <Icon size={10} />
      <span>{label}</span>
    </span>;
};

// Risk Level Badge Component
const RiskLevelBadge = ({
  level
}: {
  level: RiskLevel;
}) => {
  const config = {
    low: {
      label: 'Low Risk',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    medium: {
      label: 'Medium Risk',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    high: {
      label: 'High Risk',
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    critical: {
      label: 'Critical Risk',
      color: 'bg-red-50 text-red-700 border-red-200'
    }
  };
  const {
    label,
    color
  } = config[level];
  return <div className={cn('px-3 py-1 rounded-full text-xs font-bold border', color)}>
      {label}
    </div>;
};

// Intent Signal Badge Component
const IntentBadge = ({
  intent
}: {
  intent: IntentSignal;
}) => {
  const config = {
    organic: {
      label: 'Organic',
      color: 'text-gray-600',
      icon: Activity
    },
    opportunistic: {
      label: 'Opportunistic',
      color: 'text-amber-600',
      icon: Zap
    },
    coordinated: {
      label: 'Coordinated',
      color: 'text-red-600',
      icon: Target
    }
  };
  const {
    label,
    color,
    icon: Icon
  } = config[intent];
  return <div className={cn('flex items-center space-x-1 text-xs font-medium', color)}>
      <Icon size={12} />
      <span>{label}</span>
    </div>;
};

// Strength Score Gauge Component
const StrengthGauge = ({
  score
}: {
  score: number;
}) => {
  const getColor = () => {
    if (score < 40) return 'text-emerald-600';
    if (score < 60) return 'text-amber-600';
    if (score < 80) return 'text-orange-600';
    return 'text-red-600';
  };
  return <div className="flex items-center space-x-2">
      <div className="relative w-16 h-16">
        <svg className="transform -rotate-90" width="64" height="64">
          <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="6" fill="none" />
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray={`${score * 1.76} 176`} className={getColor()} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-xs font-bold', getColor())}>{score}</span>
        </div>
      </div>
    </div>;
};

// Mini Sparkline Component
const MiniSparkline = ({
  data
}: {
  data: number[];
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalize = (val: number) => (val - min) / (max - min) * 100;
  const points = data.map((val, i) => {
    const x = i / (data.length - 1) * 100;
    const y = 100 - normalize(val);
    return `${x},${y}`;
  }).join(' ');
  const isRising = data[data.length - 1] > data[0];
  return <svg className="w-16 h-6" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" className={cn(isRising ? 'text-red-500' : 'text-emerald-500')} />
    </svg>;
};

// Platform Distribution Component
const PlatformDistribution = ({
  platforms
}: {
  platforms: {
    news: number;
    social: number;
    forums: number;
  };
}) => {
  return <div className="flex items-center space-x-1">
      {platforms.news > 0 && <div className="flex items-center space-x-0.5 text-gray-600 text-[10px] font-medium">
          <Globe size={10} />
          <span>{platforms.news}%</span>
        </div>}
      {platforms.social > 0 && <div className="flex items-center space-x-0.5 text-blue-600 text-[10px] font-medium">
          <MessageSquare size={10} />
          <span>{platforms.social}%</span>
        </div>}
      {platforms.forums > 0 && <div className="flex items-center space-x-0.5 text-orange-600 text-[10px] font-medium">
          <BarChart2 size={10} />
          <span>{platforms.forums}%</span>
        </div>}
    </div>;
};

// Narrative Card Component
const NarrativeCard = ({
  narrative,
  onSelect
}: {
  narrative: Narrative;
  onSelect: () => void;
}) => {
  return <motion.div layout initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} whileHover={{
    y: -2
  }} onClick={onSelect} className={cn('bg-white rounded-xl border shadow-sm transition-all cursor-pointer', narrative.riskLevel === 'critical' ? 'border-red-200 shadow-red-100/50' : 'border-gray-200', 'hover:border-[#1F9D8A] hover:shadow-md')}>
      {/* Card Header */}
      <div className="p-5 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-3">
            <h3 className="font-bold text-[#0F1C2E] text-lg leading-tight mb-2">{narrative.title}</h3>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <TypeBadge type={narrative.type} />
              <StatusBadge status={narrative.status} />
            </div>
          </div>
          <StrengthGauge score={narrative.strengthScore} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{narrative.summary}</p>
      </div>

      {/* Narrative Strength Indicators */}
      <div className="p-5 pb-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Volume</div>
            <div className="text-lg font-bold text-[#0F1C2E]">{narrative.volumeOfMentions.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Persistence</div>
            <div className="text-lg font-bold text-[#0F1C2E]">{narrative.persistenceDays} days</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Amplification</span>
          <div className="flex items-center space-x-2">
            {narrative.amplificationVelocity > 0 ? <ArrowUpRight size={14} className="text-red-600" /> : <ArrowDownRight size={14} className="text-emerald-600" />}
            <span className={cn('text-sm font-bold', narrative.amplificationVelocity > 0 ? 'text-red-600' : 'text-emerald-600')}>
              {Math.abs(narrative.amplificationVelocity)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Risk Level</span>
          <RiskLevelBadge level={narrative.riskLevel} />
        </div>
      </div>

      {/* Supporting Structure */}
      <div className="p-5 pt-3 border-t border-gray-100">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Contributing Topics</span>
            <span className="font-semibold text-[#0F1C2E]">{narrative.contributingTopics}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reinforcing Posts</span>
            <span className="font-semibold text-[#0F1C2E]">{narrative.reinforcingPosts.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Intent Signal</span>
            <IntentBadge intent={narrative.intentSignal} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <PlatformDistribution platforms={narrative.platforms} />
          {narrative.influencerInvolvement && <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
              🎯 Influencer-Driven
            </span>}
        </div>

        {narrative.affectedEntities.length > 0 && <div className="flex flex-wrap gap-1 mt-3">
            {narrative.affectedEntities.slice(0, 3).map((entity, idx) => <span key={idx} className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-[10px] font-medium">
                {entity}
              </span>)}
          </div>}
      </div>

      {/* Card Footer */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white rounded transition-colors">
            <Eye size={12} />
            <span>View</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white rounded transition-colors">
            <FileText size={12} />
            <span>Feed</span>
          </button>
        </div>
        <button className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1F9D8A] rounded-lg hover:bg-[#188976] transition-colors">
          Draft Response
        </button>
      </div>
    </motion.div>;
};

// Narrative Detail Side Panel
const NarrativeDetailPanel = ({
  narrative,
  onClose
}: {
  narrative: Narrative | null;
  onClose: () => void;
}) => {
  if (!narrative) return null;
  return <AnimatePresence>
      <motion.div initial={{
      x: '100%'
    }} animate={{
      x: 0
    }} exit={{
      x: '100%'
    }} transition={{
      type: 'spring',
      damping: 25,
      stiffness: 200
    }} className="fixed right-0 top-0 h-full w-[520px] bg-white border-l border-gray-200 shadow-2xl z-50 overflow-y-auto">
        {/* Panel Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold text-[#0F1C2E] mb-3 leading-tight">{narrative.title}</h2>
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <TypeBadge type={narrative.type} />
                <StatusBadge status={narrative.status} />
                <RiskLevelBadge level={narrative.riskLevel} />
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <XIcon size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{narrative.summary}</p>
        </div>

        {/* Panel Content */}
        <div className="p-6 space-y-6">
          {/* Narrative Overview */}
          <section>
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">First Emergence</span>
                <span className="font-semibold text-[#0F1C2E]">{narrative.firstEmergence}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Stage</span>
                <StatusBadge status={narrative.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">AI Confidence</span>
                <span className="font-semibold text-[#0F1C2E]">{narrative.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Intent Signal</span>
                <IntentBadge intent={narrative.intentSignal} />
              </div>
            </div>
          </section>

          {/* Narrative Strength */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-4">Narrative Strength</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm">Overall Score</span>
              <div className="flex items-center space-x-3">
                <StrengthGauge score={narrative.strengthScore} />
                <span className="text-2xl font-bold text-[#0F1C2E]">{narrative.strengthScore}/100</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Volume</div>
                <div className="text-lg font-bold text-[#0F1C2E]">{(narrative.volumeOfMentions / 1000).toFixed(1)}K</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Persistence</div>
                <div className="text-lg font-bold text-[#0F1C2E]">{narrative.persistenceDays}d</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Velocity</div>
                <div className={cn('text-lg font-bold', narrative.amplificationVelocity > 0 ? 'text-red-600' : 'text-emerald-600')}>
                  {narrative.amplificationVelocity > 0 ? '+' : ''}{narrative.amplificationVelocity}
                </div>
              </div>
            </div>
          </section>

          {/* Narrative Evolution Timeline */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-4">Evolution Timeline</h3>
            <div className="h-32 w-full bg-gray-50 rounded-lg p-4 flex items-end space-x-2">
              {narrative.trendData.map((value, idx) => <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className={cn('w-full rounded-t transition-all', value > 70 ? 'bg-red-500' : value > 50 ? 'bg-orange-500' : 'bg-amber-500')} style={{
                height: `${value}%`
              }} />
                </div>)}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>7 days ago</span>
              <span>Today</span>
            </div>
          </section>

          {/* Narrative Drivers */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">Key Framing Phrases</h3>
            <div className="space-y-2">
              {narrative.keyFrames.map((frame, idx) => <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm font-medium text-red-900">"{frame}"</span>
                </div>)}
            </div>
          </section>

          {/* Topic & Issue Mapping */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">Contributing Topics</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Topics feeding this narrative</span>
                <span className="text-lg font-bold text-[#0F1C2E]">{narrative.contributingTopics}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Reinforcing posts</span>
                <span className="text-lg font-bold text-[#0F1C2E]">{narrative.reinforcingPosts.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Geographic & Platform Spread */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">Geographic Spread</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {narrative.geographicSpread.map((region, idx) => <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 flex items-center space-x-1">
                  <MapPin size={12} />
                  <span>{region}</span>
                </span>)}
            </div>

            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Platform Distribution</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium flex items-center space-x-1">
                    <Globe size={14} />
                    <span>News</span>
                  </span>
                  <span className="font-bold text-[#0F1C2E]">{narrative.platforms.news}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-600 rounded-full" style={{
                  width: `${narrative.platforms.news}%`
                }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium flex items-center space-x-1">
                    <MessageSquare size={14} />
                    <span>Social Media</span>
                  </span>
                  <span className="font-bold text-[#0F1C2E]">{narrative.platforms.social}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{
                  width: `${narrative.platforms.social}%`
                }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium flex items-center space-x-1">
                    <BarChart2 size={14} />
                    <span>Forums</span>
                  </span>
                  <span className="font-bold text-[#0F1C2E]">{narrative.platforms.forums}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 rounded-full" style={{
                  width: `${narrative.platforms.forums}%`
                }} />
                </div>
              </div>
            </div>
          </section>

          {/* Affected Entities */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">Affected Entities</h3>
            <div className="flex flex-wrap gap-2">
              {narrative.affectedEntities.map((entity, idx) => <span key={idx} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                  {entity}
                </span>)}
            </div>
          </section>

          {/* Counter-Narrative Intelligence */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">
              <div className="flex items-center space-x-2">
                <Lightbulb size={16} className="text-[#1F9D8A]" />
                <span>Counter-Narrative Intelligence</span>
              </div>
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                <strong>Suggested Reframe:</strong> Focus on concrete safety improvements and third-party validation
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                <strong>Evidence Gap:</strong> Need recent customer testimonials and safety audit results
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900">
                <strong>Messaging Tip:</strong> Avoid defensive language; lead with empathy and action
              </div>
            </div>
          </section>

          {/* Recommended Strategic Actions */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-[#1F9D8A]" />
                <span>Recommended Actions</span>
              </div>
            </h3>
            <div className="space-y-2">
              {narrative.riskLevel === 'critical' && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
                  <AlertTriangle size={14} className="inline mr-2" />
                  <strong>Crisis escalation required</strong> - Activate response team immediately
                </div>}
              {narrative.amplificationVelocity > 100 && <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-900">
                  <Bell size={14} className="inline mr-2" />
                  <strong>Deploy counter-narrative</strong> - Narrative spreading rapidly
                </div>}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                <CheckCircle size={14} className="inline mr-2" />
                <strong>Engage selectively</strong> - Target key influencers and platforms
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <section className="pt-6 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <button className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                View Topics
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Open Feed
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-[#1F9D8A] rounded-lg hover:bg-[#188976] transition-colors col-span-2">
                Draft Counter-Narrative
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors">
                Escalate
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Archive
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </AnimatePresence>;
};

// Filter Chip Component
const FilterChip = ({
  label,
  active,
  onClick,
  onRemove
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  onRemove?: () => void;
}) => <button onClick={onClick} className={cn('flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all', active ? 'bg-[#1F9D8A] text-white' : 'bg-white text-gray-700 border border-gray-300 hover:border-[#1F9D8A]')}>
    <span>{label}</span>
    {active && onRemove && <XIcon size={12} onClick={e => {
    e.stopPropagation();
    onRemove();
  }} className="hover:scale-110" />}
  </button>;

// Main Narratives Page Component
export const NarrativesPage = () => {
  const [sortBy, setSortBy] = useState<SortOption>('strength');
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [configurationId, setConfigurationId] = useState<string | null>(null);

  useEffect(() => {
    loadNarratives();
  }, [sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadNarratives();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadNarratives = async () => {
    try {
      setLoading(true);
      const activeConfig = await ConfigurationApi.getActive();
      if (activeConfig) {
        setConfigurationId(activeConfig.id);
      }

      const sortMap: Record<SortOption, string> = {
        strength: 'strength_score',
        growth: 'last_updated_at',
        damage: 'average_risk_score',
        duration: 'persistence_days',
      };

      const response = await narrativesApi.getAll({
        configuration_id: activeConfig?.id,
        sort_by: sortMap[sortBy],
        order: 'desc',
      });

      let filtered = response.data || [];

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(narrative =>
          narrative.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          narrative.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          narrative.affectedEntities.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      setNarratives(filtered);
    } catch (error) {
      console.error('Error loading narratives:', error);
      setNarratives([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNarratives = narratives;

  return <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-0">
      {/* Top Strategic Context Bar (Sticky) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search narratives, frames, perceptions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1F9D8A] focus:border-transparent transition-all outline-none" />
          </div>
        </div>

        {/* Strategic Filters & Controls */}
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Filters */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <Filter size={16} className="text-gray-500" />

            {/* Narrative Type Filters */}
            <FilterChip label="Reputational" active={false} onClick={() => {}} />
            <FilterChip label="Ethical" active={false} onClick={() => {}} />
            <FilterChip label="Safety" active={false} onClick={() => {}} />

            <div className="h-4 w-px bg-gray-300 mx-1" />

            {/* Status Filters */}
            <FilterChip label="Emerging" active={false} onClick={() => {}} />
            <FilterChip label="Established" active={false} onClick={() => {}} />
            <FilterChip label="Entrenched" active={false} onClick={() => {}} />

            <div className="h-4 w-px bg-gray-300 mx-1" />

            {/* Risk Level Filters */}
            <FilterChip label="High Risk" active={false} onClick={() => {}} />
            <FilterChip label="Critical" active={false} onClick={() => {}} />

            <div className="h-4 w-px bg-gray-300 mx-1" />

            {/* Intent Signal Filters */}
            <FilterChip label="Coordinated" active={false} onClick={() => {}} />
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-medium">Sort:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="text-xs font-semibold text-[#0F1C2E] bg-transparent border-none focus:ring-0 cursor-pointer">
                <option value="strength">Narrative Strength</option>
                <option value="growth">Fastest Growing</option>
                <option value="damage">Most Damaging</option>
                <option value="duration">Longest Running</option>
              </select>
            </div>

            {/* Create Narrative */}
            <button className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1F9D8A] rounded-lg hover:bg-[#188976] transition-colors">
              + Create Narrative
            </button>

            {/* Playbook Toggle */}
            <button className="px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1">
              <BookOpen size={14} />
              <span>Playbook</span>
            </button>
          </div>
        </div>
      </div>

      {/* Narrative Landscape Overview */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredNarratives.length === 0 ? (
          <div className="max-w-7xl mx-auto text-center py-12">
            <p className="text-gray-500">No narratives found. Posts will be automatically grouped as they are analyzed.</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNarratives.map(narrative => <NarrativeCard key={narrative.id} narrative={narrative} onSelect={() => setSelectedNarrative(narrative)} />)}
          </div>
        )}
      </div>

      {/* Narrative Detail Side Panel */}
      {selectedNarrative && <NarrativeDetailPanel narrative={selectedNarrative} onClose={() => setSelectedNarrative(null)} />}
    </div>;
};