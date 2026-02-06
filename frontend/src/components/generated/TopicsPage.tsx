"use client";

import React, { useState, useEffect } from 'react';
import { Search, X as XIcon, TrendingUp, TrendingDown, Sparkles, ArrowUpRight, MessageSquare, Globe, BarChart2, AlertTriangle, Eye, Bell, CheckCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { topicsApi, Topic as TopicType } from '../../services/topicsApi';
import { ConfigurationApi } from '../../services/configurationApi';

// Types
type TopicStatus = 'emerging' | 'active' | 'stabilizing' | 'dormant';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ViewMode = 'grid' | 'table';
type SortOption = 'risk' | 'growth' | 'volume' | 'negative';
interface Topic {
  id: string;
  name: string;
  status: TopicStatus;
  summary: string;
  mentions: number;
  riskScore: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  velocity: 'rising' | 'stable' | 'declining';
  platforms: {
    news: number;
    social: number;
    forums: number;
  };
  platformDetails?: {
    twitter: number;
    reddit: number;
    facebook: number;
    news: number;
  };
  entities: string[];
  location?: string;
  firstDetected: string;
  lastUpdated: string;
  narratives: string[];
  trendData: number[];
}

// Mock Data
const MOCK_TOPICS: Topic[] = [{
  id: '1',
  name: 'Baggage Mishandling at JFK',
  status: 'active',
  summary: 'Spike in negative news coverage related to delayed baggage handling at JFK airport.',
  mentions: 2847,
  riskScore: 8.5,
  sentiment: {
    positive: 5,
    neutral: 20,
    negative: 75
  },
  velocity: 'rising',
  platforms: {
    news: 45,
    social: 40,
    forums: 15
  },
  entities: ['JFK Airport', 'American Airlines', 'TSA'],
  location: 'New York, NY',
  firstDetected: '2 days ago',
  lastUpdated: '5m ago',
  narratives: ['Customer Service Issues', 'Airport Operations'],
  trendData: [2, 5, 12, 18, 25, 32, 35]
}, {
  id: '2',
  name: 'CEO Remarks at TechConf',
  status: 'emerging',
  summary: 'Mixed reactions to CEO comments on AI integration during keynote presentation.',
  mentions: 1523,
  riskScore: 6.2,
  sentiment: {
    positive: 45,
    neutral: 35,
    negative: 20
  },
  velocity: 'rising',
  platforms: {
    news: 30,
    social: 60,
    forums: 10
  },
  entities: ['Tech Conference', 'AI Strategy', 'Leadership'],
  firstDetected: '6 hours ago',
  lastUpdated: '12m ago',
  narratives: ['Thought Leadership'],
  trendData: [1, 3, 8, 15, 22, 28, 30]
}, {
  id: '3',
  name: 'Product Pricing Concerns',
  status: 'active',
  summary: 'Growing discussion around new pricing structure and enterprise tier costs.',
  mentions: 4892,
  riskScore: 7.8,
  sentiment: {
    positive: 15,
    neutral: 30,
    negative: 55
  },
  velocity: 'rising',
  platforms: {
    news: 20,
    social: 50,
    forums: 30
  },
  entities: ['Pricing Strategy', 'Enterprise Customers', 'Competition'],
  firstDetected: '5 days ago',
  lastUpdated: '2m ago',
  narratives: ['Pricing Criticism', 'Market Position'],
  trendData: [10, 15, 22, 28, 35, 42, 48]
}, {
  id: '4',
  name: 'Sustainability Initiative Launch',
  status: 'stabilizing',
  summary: 'Positive reception to new environmental commitments and carbon neutrality goals.',
  mentions: 3214,
  riskScore: 2.1,
  sentiment: {
    positive: 70,
    neutral: 25,
    negative: 5
  },
  velocity: 'stable',
  platforms: {
    news: 60,
    social: 30,
    forums: 10
  },
  entities: ['Sustainability', 'ESG', 'Corporate Responsibility'],
  location: 'Global',
  firstDetected: '1 week ago',
  lastUpdated: '1h ago',
  narratives: ['ESG Leadership', 'Brand Reputation'],
  trendData: [40, 38, 35, 33, 32, 32, 31]
}, {
  id: '5',
  name: 'Data Privacy Update',
  status: 'active',
  summary: 'Questions emerging about data handling practices following policy update.',
  mentions: 5621,
  riskScore: 9.2,
  sentiment: {
    positive: 10,
    neutral: 25,
    negative: 65
  },
  velocity: 'rising',
  platforms: {
    news: 55,
    social: 35,
    forums: 10
  },
  entities: ['Privacy Policy', 'Data Security', 'GDPR'],
  location: 'Europe',
  firstDetected: '3 days ago',
  lastUpdated: '8m ago',
  narratives: ['Privacy Concerns', 'Regulatory Scrutiny'],
  trendData: [15, 22, 35, 45, 52, 56, 58]
}, {
  id: '6',
  name: 'Partnership Announcement',
  status: 'emerging',
  summary: 'Initial coverage of strategic partnership with major retail chain.',
  mentions: 892,
  riskScore: 3.5,
  sentiment: {
    positive: 60,
    neutral: 30,
    negative: 10
  },
  velocity: 'rising',
  platforms: {
    news: 70,
    social: 20,
    forums: 10
  },
  entities: ['Strategic Partnership', 'Retail Sector', 'Growth'],
  firstDetected: '4 hours ago',
  lastUpdated: '15m ago',
  narratives: ['Market Expansion'],
  trendData: [1, 2, 4, 6, 8, 9, 10]
}, {
  id: '7',
  name: 'Customer Support Delays',
  status: 'active',
  summary: 'Increasing complaints about response times and resolution quality.',
  mentions: 2156,
  riskScore: 6.8,
  sentiment: {
    positive: 10,
    neutral: 35,
    negative: 55
  },
  velocity: 'stable',
  platforms: {
    news: 15,
    social: 70,
    forums: 15
  },
  entities: ['Customer Service', 'Support Quality', 'Response Time'],
  firstDetected: '10 days ago',
  lastUpdated: '25m ago',
  narratives: ['Service Quality Issues'],
  trendData: [20, 21, 20, 22, 21, 22, 21]
}, {
  id: '8',
  name: 'Product Feature Update',
  status: 'stabilizing',
  summary: 'User feedback on latest software release showing mixed but improving sentiment.',
  mentions: 1678,
  riskScore: 4.2,
  sentiment: {
    positive: 50,
    neutral: 35,
    negative: 15
  },
  velocity: 'declining',
  platforms: {
    news: 10,
    social: 60,
    forums: 30
  },
  entities: ['Product Development', 'User Experience', 'Innovation'],
  firstDetected: '2 weeks ago',
  lastUpdated: '45m ago',
  narratives: ['Product Innovation'],
  trendData: [30, 28, 25, 22, 20, 18, 17]
}];

// Status Badge Component
const StatusBadge = ({
  status
}: {
  status: TopicStatus;
}) => {
  const config = {
    emerging: {
      label: 'Emerging',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    active: {
      label: 'Active',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    stabilizing: {
      label: 'Stabilizing',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    dormant: {
      label: 'Dormant',
      color: 'bg-gray-50 text-gray-700 border-gray-200'
    }
  };
  const {
    label,
    color
  } = config[status];
  return <span className={cn('px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border', color)}>
      {label}
    </span>;
};

// Risk Badge Component
const RiskBadge = ({
  score
}: {
  score: number;
}) => {
  const getColor = () => {
    if (score < 5) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score < 7) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (score < 9) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };
  return <div className={cn('px-3 py-1 rounded-full text-xs font-bold border', getColor())}>
      {score.toFixed(1)}/10
    </div>;
};

// Velocity Indicator Component
const VelocityIndicator = ({
  velocity
}: {
  velocity: 'rising' | 'stable' | 'declining';
}) => {
  const config = {
    rising: {
      icon: TrendingUp,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    stable: {
      icon: ArrowUpRight,
      color: 'text-gray-600',
      bg: 'bg-gray-50'
    },
    declining: {
      icon: TrendingDown,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }
  };
  const {
    icon: Icon,
    color,
    bg
  } = config[velocity];
  return <div className={cn('flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold uppercase', bg, color)}>
      <Icon size={12} />
      <span>{velocity}</span>
    </div>;
};

// Sentiment Label Component (based on risk score)
const SentimentLabel = ({
  riskScore
}: {
  riskScore: number;
}) => {
  let sentiment: 'positive' | 'neutral' | 'negative';
  let colorClass: string;
  
  if (riskScore >= 7) {
    sentiment = 'negative';
    colorClass = 'bg-red-100 text-red-700 border-red-200';
  } else if (riskScore >= 4) {
    sentiment = 'neutral';
    colorClass = 'bg-gray-100 text-gray-700 border-gray-200';
  } else {
    sentiment = 'positive';
    colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-medium border ${colorClass}`}>
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </span>
  );
};

// Sparkline Component
const Sparkline = ({
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
  return <svg className="w-20 h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" className={cn(data[data.length - 1] > data[0] ? 'text-red-500' : 'text-emerald-500')} />
    </svg>;
};

// Platform Distribution Component
const PlatformDistribution = ({
  platformDetails
}: {
  platformDetails?: {
    twitter: number;
    reddit: number;
    facebook: number;
    news: number;
  };
}) => {
  if (!platformDetails) return null;
  
  return <div className="flex items-center space-x-2">
      {platformDetails.twitter > 0 && <div className="flex items-center space-x-1 text-[10px] font-medium">
          <span className="w-4 h-4 bg-black rounded flex items-center justify-center text-white text-[8px] font-bold">𝕏</span>
          <span className="text-gray-700">{platformDetails.twitter}%</span>
        </div>}
      {platformDetails.reddit > 0 && <div className="flex items-center space-x-1 text-[10px] font-medium">
          <span className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center text-white text-[8px] font-bold">R</span>
          <span className="text-gray-700">{platformDetails.reddit}%</span>
        </div>}
      {platformDetails.facebook > 0 && <div className="flex items-center space-x-1 text-[10px] font-medium">
          <span className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">f</span>
          <span className="text-gray-700">{platformDetails.facebook}%</span>
        </div>}
      {platformDetails.news > 0 && <div className="flex items-center space-x-1 text-gray-600 text-[10px] font-medium">
          <Globe size={12} />
          <span>{platformDetails.news}%</span>
        </div>}
    </div>;
};

// Topic Card Component (Grid View)
const TopicCard = ({
  topic,
  onSelect,
  onViewFeed
}: {
  topic: Topic;
  onSelect: () => void;
  onViewFeed?: () => void;
}) => {
  const dominantSentiment = topic.sentiment.positive > topic.sentiment.negative ? 'positive' : topic.sentiment.negative > topic.sentiment.positive ? 'negative' : 'neutral';
  return <motion.div layout initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} whileHover={{
    y: -2
  }} onClick={onSelect} className={cn('bg-white rounded-xl border shadow-sm transition-all cursor-pointer', topic.riskScore >= 8 ? 'border-red-200 shadow-red-100/50' : 'border-gray-200', 'hover:border-[#1F9D8A] hover:shadow-md')}>
      {/* Card Header */}
      <div className="p-5 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-[#0F1C2E] text-lg flex-1 pr-3">{topic.name}</h3>
          <StatusBadge status={topic.status} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{topic.summary}</p>
      </div>

      {/* Key Metrics */}
      <div className="p-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Total Mentions</span>
          <span className="text-sm font-bold text-[#0F1C2E]">{topic.mentions.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Sentiment</span>
          <SentimentLabel riskScore={topic.riskScore} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Risk Score</span>
          <RiskBadge score={topic.riskScore} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Velocity</span>
          <VelocityIndicator velocity={topic.velocity} />
        </div>
      </div>

      {/* Composition & Trend */}
      <div className="p-5 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">Platforms</span>
            <PlatformDistribution platformDetails={topic.platformDetails} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Risk Trend</span>
          <Sparkline data={topic.trendData} />
        </div>

        {topic.entities.length > 0 && <div className="flex flex-wrap gap-1 mt-3">
            {topic.entities.slice(0, 3).map((entity, idx) => <span key={idx} className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-[10px] font-medium">
                {entity}
              </span>)}
          </div>}
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewFeed?.();
          }}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white rounded transition-colors"
        >
          <Eye size={12} />
          <span>View Feed</span>
        </button>
        <button className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1F9D8A] rounded-lg hover:bg-[#188976] transition-colors">
          Promote
        </button>
      </div>
    </motion.div>;
};

// Table Row Component (Table View)
const TopicTableRow = ({
  topic,
  onSelect
}: {
  topic: Topic;
  onSelect: () => void;
}) => {
  return <motion.tr initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" onClick={onSelect}>
      <td className="px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className={cn('w-1 h-12 rounded-full', topic.riskScore >= 7 ? 'bg-red-500' : topic.riskScore >= 5 ? 'bg-orange-500' : topic.riskScore >= 4 ? 'bg-amber-500' : 'bg-emerald-500')} />
          <div>
            <div className="font-semibold text-[#0F1C2E]">{topic.name}</div>
            <div className="text-xs text-gray-500">{topic.summary.slice(0, 60)}...</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={topic.status} />
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-[#0F1C2E]">
        {topic.mentions.toLocaleString()}
      </td>
      <td className="px-4 py-4">
        <RiskBadge score={topic.riskScore} />
      </td>
      <td className="px-4 py-4">
        <SentimentLabel riskScore={topic.riskScore} />
      </td>
      <td className="px-4 py-4">
        <VelocityIndicator velocity={topic.velocity} />
      </td>
      <td className="px-4 py-4">
        <PlatformDistribution platformDetails={topic.platformDetails} />
      </td>
      <td className="px-4 py-4 text-xs text-gray-500">
        {topic.lastUpdated}
      </td>
      <td className="px-4 py-4">
        <button className="p-2 text-gray-400 hover:text-[#1F9D8A] transition-colors">
          <ChevronRight size={18} />
        </button>
      </td>
    </motion.tr>;
};

// Topic Detail Modal
const TopicDetailPanel = ({
  topic,
  onClose,
  onViewFeed
}: {
  topic: Topic | null;
  onClose: () => void;
  onViewFeed?: () => void;
}) => {
  if (!topic) return null;
  return <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40"
        />
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-4 md:inset-8 lg:inset-16 z-50 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-y-auto">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold text-[#0F1C2E] mb-2">{topic.name}</h2>
              <StatusBadge status={topic.status} />
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <XIcon size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{topic.summary}</p>
        </div>

            {/* Panel Content */}
            <div className="p-6 space-y-6">
          {/* Topic Overview */}
          <section>
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">First Detected</span>
                <span className="font-semibold text-[#0F1C2E]">{topic.firstDetected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-semibold text-[#0F1C2E]">{topic.lastUpdated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lifecycle Stage</span>
                <StatusBadge status={topic.status} />
              </div>
              {topic.location && <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="font-semibold text-[#0F1C2E]">{topic.location}</span>
                </div>}
            </div>
          </section>

          {/* Metrics */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Total Mentions</div>
                <div className="text-2xl font-bold text-[#0F1C2E]">{topic.mentions.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Risk Score</div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-[#0F1C2E]">{topic.riskScore.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">/10</span>
                </div>
              </div>
            </div>
          </section>

          {/* Sentiment Breakdown */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-4">Sentiment Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-emerald-700 font-medium">Positive</span>
                  <span className="font-bold text-[#0F1C2E]">{topic.sentiment.positive}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{
                  width: `${topic.sentiment.positive}%`
                }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">Neutral</span>
                  <span className="font-bold text-[#0F1C2E]">{topic.sentiment.neutral}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full transition-all" style={{
                  width: `${topic.sentiment.neutral}%`
                }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-700 font-medium">Negative</span>
                  <span className="font-bold text-[#0F1C2E]">{topic.sentiment.negative}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all" style={{
                  width: `${topic.sentiment.negative}%`
                }} />
                </div>
              </div>
            </div>
          </section>

          {/* Platform Distribution */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-4">Platform Distribution</h3>
            <div className="space-y-3">
              {(topic.platformDetails?.twitter || 0) > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium flex items-center space-x-2">
                      <span className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-[10px] font-bold">𝕏</span>
                      <span>Twitter/X</span>
                    </span>
                    <span className="font-bold text-[#0F1C2E]">{topic.platformDetails?.twitter}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full" style={{ width: `${topic.platformDetails?.twitter}%` }} />
                  </div>
                </div>
              )}
              {(topic.platformDetails?.reddit || 0) > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium flex items-center space-x-2">
                      <span className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-white text-[10px] font-bold">R</span>
                      <span>Reddit</span>
                    </span>
                    <span className="font-bold text-[#0F1C2E]">{topic.platformDetails?.reddit}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${topic.platformDetails?.reddit}%` }} />
                  </div>
                </div>
              )}
              {(topic.platformDetails?.facebook || 0) > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium flex items-center space-x-2">
                      <span className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">f</span>
                      <span>Facebook</span>
                    </span>
                    <span className="font-bold text-[#0F1C2E]">{topic.platformDetails?.facebook}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${topic.platformDetails?.facebook}%` }} />
                  </div>
                </div>
              )}
              {(topic.platformDetails?.news || 0) > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium flex items-center space-x-2">
                      <Globe size={16} className="text-gray-600" />
                      <span>News</span>
                    </span>
                    <span className="font-bold text-[#0F1C2E]">{topic.platformDetails?.news}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-600 rounded-full" style={{ width: `${topic.platformDetails?.news}%` }} />
                  </div>
                </div>
              )}
              {(!topic.platformDetails || (topic.platformDetails.twitter === 0 && topic.platformDetails.reddit === 0 && topic.platformDetails.facebook === 0 && topic.platformDetails.news === 0)) && (
                <p className="text-sm text-gray-500">No platform data available</p>
              )}
            </div>
          </section>

          {/* Associated Narratives */}
          {topic.narratives.length > 0 && <section className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">Associated Narratives</h3>
              <div className="space-y-2">
                {topic.narratives.map((narrative, idx) => <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <span className="text-sm font-medium text-indigo-900">📖 {narrative}</span>
                    <ChevronRight size={16} className="text-indigo-600" />
                  </div>)}
              </div>
            </section>}

          {/* Key Entities */}
          {topic.entities.length > 0 && <section className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">Key Entities</h3>
              <div className="flex flex-wrap gap-2">
                {topic.entities.map((entity, idx) => <span key={idx} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                    {entity}
                  </span>)}
              </div>
            </section>}

          {/* Recommended Actions */}
          <section className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wider mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-[#1F9D8A]" />
                <span>AI Recommended Actions</span>
              </div>
            </h3>
            <div className="space-y-2">
              {topic.riskScore >= 7 && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
                  <AlertTriangle size={14} className="inline mr-2" />
                  <strong>Escalate to crisis team</strong> - High risk requires immediate attention
                </div>}
              {topic.velocity === 'rising' && <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                  <Bell size={14} className="inline mr-2" />
                  <strong>Monitor closely</strong> - Topic is gaining momentum
                </div>}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                <CheckCircle size={14} className="inline mr-2" />
                <strong>Prepare response</strong> - Draft messaging for stakeholders
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <section className="pt-6 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => onViewFeed?.()}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Feed
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-[#1F9D8A] rounded-lg hover:bg-[#188976] transition-colors">
                Promote to Narrative
              </button>
            </div>
          </section>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>;
};

// Main Topics Page Component
export const TopicsPage = ({ onNavigateToFeed }: { onNavigateToFeed?: (topicId: string) => void }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('risk');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [configurationId, setConfigurationId] = useState<string | null>(null);

  useEffect(() => {
    loadTopics();
  }, [sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadTopics();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const activeConfig = await ConfigurationApi.getActive();
      if (activeConfig) {
        setConfigurationId(activeConfig.id);
      }

      const sortMap: Record<SortOption, string> = {
        risk: 'average_risk_score',
        growth: 'last_updated_at',
        volume: 'post_count',
        negative: 'average_risk_score',
      };

      const response = await topicsApi.getAll({
        configuration_id: activeConfig?.id,
        sort_by: sortMap[sortBy],
        order: sortBy === 'risk' || sortBy === 'negative' ? 'desc' : 'desc',
      });

      let filtered = response.data || [];

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(topic =>
          topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.entities.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      setTopics(filtered);
    } catch (error) {
      console.error('Error loading topics:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = topics;

  return <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-0">
      {/* Top Context & Control Bar (Sticky) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search topics, keywords, entities..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1F9D8A] focus:border-transparent transition-all outline-none" />
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 flex items-center justify-end">
          <div className="flex items-center space-x-4">
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-medium">Sort:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="text-xs font-semibold text-[#0F1C2E] bg-transparent border-none focus:ring-0 cursor-pointer">
                <option value="risk">Highest Risk</option>
                <option value="growth">Fastest Growing</option>
                <option value="volume">Most Volume</option>
                <option value="negative">Most Negative</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('grid')} className={cn('px-3 py-1.5 rounded text-xs font-semibold transition-all', viewMode === 'grid' ? 'bg-white text-[#0F1C2E] shadow-sm' : 'text-gray-600')}>
                Grid
              </button>
              <button onClick={() => setViewMode('table')} className={cn('px-3 py-1.5 rounded text-xs font-semibold transition-all', viewMode === 'table' ? 'bg-white text-[#0F1C2E] shadow-sm' : 'text-gray-600')}>
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Overview */}
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
        ) : filteredTopics.length === 0 ? (
          <div className="max-w-7xl mx-auto text-center py-12">
            <p className="text-gray-500">No topics found. Posts will be automatically grouped as they are analyzed.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map(topic => <TopicCard key={topic.id} topic={topic} onSelect={() => setSelectedTopic(topic)} onViewFeed={() => onNavigateToFeed?.(topic.id)} />)}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Topic Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Mentions</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Avg Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Sentiment</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Velocity</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Platforms</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTopics.map(topic => <TopicTableRow key={topic.id} topic={topic} onSelect={() => setSelectedTopic(topic)} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Topic Detail Side Panel */}
      {selectedTopic && <TopicDetailPanel topic={selectedTopic} onClose={() => setSelectedTopic(null)} onViewFeed={() => onNavigateToFeed?.(selectedTopic.id)} />}
    </div>;
};