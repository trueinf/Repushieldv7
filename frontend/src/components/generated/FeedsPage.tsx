import React, { useState, useEffect, useRef } from 'react';
import { Search, X as XIcon, Facebook, MessageSquare, Globe, TrendingUp, Clock, ThumbsUp, Share2, MessageCircle, ChevronRight, MoreVertical, Filter, Calendar, Eye, ChevronDown, Zap, BarChart2, Loader2, RefreshCw, Rss, Languages, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { PostsApi, type Post } from '../../services/postsApi';
import { ConfigurationApi } from '../../services/configurationApi';

// Types
type Platform = 'twitter' | 'news' | 'facebook' | 'reddit';
type Sentiment = 'positive' | 'neutral' | 'negative';
type Severity = 'informational' | 'watch' | 'escalate' | 'critical';
type SortOption = 'latest' | 'risk' | 'engagement' | 'velocity';
type DateRange = 'today' | '24h' | '7d' | 'custom' | 'all';

function mapPostToFeedPost(post: Post): FeedPost {
  const getSeverity = (riskScore?: number): Severity => {
    if (!riskScore) return 'informational';
    if (riskScore >= 7) return 'critical';
    if (riskScore >= 6) return 'escalate';
    if (riskScore >= 4) return 'watch';
    return 'informational';
  };

  const getReach = (followers?: number): string => {
    if (!followers) return 'N/A';
    if (followers >= 1000000) return `${(followers / 1000000).toFixed(1)}M`;
    if (followers >= 1000) return `${(followers / 1000).toFixed(1)}K`;
    return followers.toString();
  };

  // Use author_username for Reddit, Twitter, Facebook
  // Use author_name for News
  const getAuthorDisplay = () => {
    if (post.platform === 'news') {
      return post.author_name || 'Unknown';
    }
    // For Reddit, Twitter, Facebook - use author_username
    return post.author_username || post.author_name || 'Unknown';
  };

  return {
    id: post.id,
    platform: post.platform,
    source: getAuthorDisplay(),
    handle: post.platform !== 'news' && post.author_username ? `@${post.author_username}` : undefined,
    verified: post.author_verified || false,
    timestamp: formatTimestamp(post.created_at),
    created_at: post.created_at, // Store original date for filtering
    content: post.content || post.title || '',
    riskScore: post.risk_score || 0,
    sentiment: post.sentiment || 'neutral',
    severity: getSeverity(post.risk_score),
    narrative: post.narrative,
    topics: post.topics || [],
    engagement: {
      likes: post.likes_count || 0,
      shares: post.shares_count || 0,
      comments: post.comments_count || 0,
    },
    reach: getReach(post.author_followers),
    velocity: 'stable',
    aiConfidence: 85,
    reviewed: false,
    mediaUrls: post.media_urls || [],
    mediaTypes: post.media_types || [],
    thumbnailUrl: post.thumbnail_url,
    postUrl: post.post_url,
    keywords: post.keywords || [],
    factCheckData: post.fact_check_data,
  };
}

interface FeedPost {
  id: string;
  platform: Platform;
  source: string;
  handle?: string;
  verified: boolean;
  timestamp: string;
  created_at: string; // Original date for filtering
  content: string;
  riskScore: number;
  sentiment: Sentiment;
  severity: Severity;
  narrative?: string;
  topics: string[];
  keywords?: string[];
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  reach: string;
  velocity?: 'rising' | 'stable' | 'declining';
  aiConfidence: number;
  reviewed: boolean;
  mediaUrls?: string[];
  mediaTypes?: string[];
  thumbnailUrl?: string;
  postUrl?: string;
  factCheckData?: {
    evidence: {
      sources: Array<{
        title: string;
        url: string;
        snippet: string;
      }>;
      facts: string[];
      verification: string;
    };
    truth_status: 'true' | 'false' | 'partially true' | 'misleading' | 'unverified';
    admin_response: {
      response_text: string;
      tone: string;
      key_points: string[];
    };
  };
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
interface FilterState {
  dateRange: DateRange;
  platforms: Platform[];
  sentiments: Sentiment[];
  riskScores: string[];
  searchQuery: string;
}

// Mock Data (fallback)
const MOCK_POSTS: FeedPost[] = [{
  id: '1',
  platform: 'twitter',
  source: 'TechCrunch',
  handle: '@techcrunch',
  verified: true,
  timestamp: '2m ago',
  created_at: new Date().toISOString(),
  content: 'Breaking: RepuShield announces major partnership with Fortune 500 companies. CEO claims this will "revolutionize how enterprises manage their reputation in real-time." Industry experts skeptical about scalability claims.',
  riskScore: 8.5,
  sentiment: 'negative',
  severity: 'escalate',
  narrative: 'Credibility Concerns',
  topics: ['Partnership', 'Enterprise', 'Scalability'],
  engagement: {
    likes: 1247,
    shares: 342,
    comments: 156
  },
  reach: '250K',
  velocity: 'rising',
  aiConfidence: 92,
  reviewed: false
}, {
  id: '2',
  platform: 'news',
  source: 'Business Insider',
  verified: true,
  timestamp: '15m ago',
  created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  content: 'Opinion piece praises RepuShield\'s innovative approach to narrative tracking. "The platform has given us unprecedented visibility into how our brand is perceived across digital channels," says CMO of leading retail brand.',
  riskScore: 3.2,
  sentiment: 'positive',
  severity: 'informational',
  narrative: 'Thought Leadership',
  topics: ['Innovation', 'Brand Monitoring'],
  engagement: {
    likes: 892,
    shares: 234,
    comments: 67
  },
  reach: '180K',
  velocity: 'stable',
  aiConfidence: 88,
  reviewed: false
}, {
  id: '3',
  platform: 'reddit',
  source: 'r/marketing',
  handle: 'u/digitalmarketer2024',
  verified: false,
  timestamp: '1h ago',
  created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  content: 'Has anyone tried RepuShield for reputation management? Considering it for our agency but the pricing seems steep compared to alternatives. Would love to hear real user experiences.',
  riskScore: 5.8,
  sentiment: 'neutral',
  severity: 'watch',
  topics: ['Pricing', 'User Experience', 'Competition'],
  engagement: {
    likes: 45,
    shares: 12,
    comments: 23
  },
  reach: '8.5K',
  velocity: 'stable',
  aiConfidence: 76,
  reviewed: true
}, {
  id: '4',
  platform: 'twitter',
  source: 'Industry Analyst',
  handle: '@sarahtech',
  verified: true,
  timestamp: '2h ago',
  created_at: new Date(Date.now() - 120 * 60000).toISOString(),
  content: 'RepuShield\'s Q3 numbers are impressive. 45% YoY growth in enterprise segment. The real-time sentiment analysis is a game changer. This is how modern reputation management should work. 🚀',
  riskScore: 2.1,
  sentiment: 'positive',
  severity: 'informational',
  narrative: 'Market Success',
  topics: ['Growth', 'Enterprise', 'Technology'],
  engagement: {
    likes: 2341,
    shares: 567,
    comments: 189
  },
  reach: '500K',
  velocity: 'rising',
  aiConfidence: 94,
  reviewed: false
}, {
  id: '5',
  platform: 'facebook',
  source: 'Tech Reviews Daily',
  verified: true,
  timestamp: '3h ago',
  created_at: new Date(Date.now() - 180 * 60000).toISOString(),
  content: 'Our team has been testing RepuShield for 6 months. While the narrative detection is solid, we\'ve experienced some false positives in the sentiment analysis. Customer support has been responsive though.',
  riskScore: 6.2,
  sentiment: 'neutral',
  severity: 'watch',
  topics: ['Product Issues', 'Customer Support', 'Accuracy'],
  engagement: {
    likes: 234,
    shares: 45,
    comments: 78
  },
  reach: '42K',
  velocity: 'stable',
  aiConfidence: 81,
  reviewed: false
}, {
  id: '6',
  platform: 'news',
  source: 'Reuters',
  verified: true,
  timestamp: '5h ago',
  created_at: new Date(Date.now() - 300 * 60000).toISOString(),
  content: 'RepuShield faces scrutiny over data privacy practices. European regulators questioning how the platform collects and processes social media data. Company spokesperson says they are "fully compliant with GDPR."',
  riskScore: 9.2,
  sentiment: 'negative',
  severity: 'critical',
  narrative: 'Privacy Concerns',
  topics: ['Privacy', 'Compliance', 'Regulation'],
  engagement: {
    likes: 3421,
    shares: 1234,
    comments: 892
  },
  reach: '1.2M',
  velocity: 'rising',
  aiConfidence: 96,
  reviewed: false
}];

// Platform Icons & Colors
const getPlatformIcon = (platform: Platform) => {
  switch (platform) {
    case 'twitter':
      return XIcon;
    case 'news':
      return Globe;
    case 'facebook':
      return Facebook;
    case 'reddit':
      return MessageSquare;
  }
};
const getPlatformColor = (platform: Platform) => {
  switch (platform) {
    case 'twitter':
      return 'text-blue-500';
    case 'news':
      return 'text-gray-600';
    case 'facebook':
      return 'text-blue-600';
    case 'reddit':
      return 'text-orange-500';
  }
};

// Risk Score Badge
const RiskScoreBadge = ({
  score,
  pulse
}: {
  score: number;
  pulse?: boolean;
}) => {
  const getColor = () => {
    if (score < 5) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score < 7) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };
  return <div className={cn('relative px-3 py-1 rounded-full text-xs font-bold border', getColor())}>
      {pulse && score >= 7 && <motion.div className="absolute inset-0 rounded-full bg-red-400" initial={{
      opacity: 0.5,
      scale: 1
    }} animate={{
      opacity: 0,
      scale: 1.5
    }} transition={{
      duration: 2,
      repeat: Infinity
    }} />}
      <span className="relative">{score.toFixed(1)}/10</span>
    </div>;
};

// Sentiment Badge
const SentimentBadge = ({
  sentiment
}: {
  sentiment: Sentiment;
}) => {
  const config = {
    positive: 'bg-emerald-100 text-emerald-700',
    neutral: 'bg-gray-100 text-gray-700',
    negative: 'bg-red-100 text-red-700'
  };
  return <span className={cn('px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider', config[sentiment])}>
      {sentiment}
    </span>;
};

// Severity Badge
const SeverityBadge = ({
  severity
}: {
  severity: Severity;
}) => {
  const config = {
    informational: {
      label: 'Info',
      color: 'bg-blue-100 text-blue-700'
    },
    watch: {
      label: 'Watch',
      color: 'bg-yellow-100 text-yellow-700'
    },
    escalate: {
      label: 'Escalate',
      color: 'bg-orange-100 text-orange-700'
    },
    critical: {
      label: 'Critical',
      color: 'bg-red-100 text-red-700'
    }
  };
  const {
    label,
    color
  } = config[severity];
  return <span className={cn('px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider', color)}>
      {label}
    </span>;
};

// Feed Card Component
const FeedCard = ({
  post,
  onExpand,
  onSelect
}: {
  post: FeedPost;
  onExpand: () => void;
  onSelect: () => void;
}) => {
  const [showActions, setShowActions] = useState(false);
  const PlatformIcon = getPlatformIcon(post.platform);
  const platformColor = getPlatformColor(post.platform);
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;

  // Highlight key negative phrases
  const highlightContent = (content: string) => {
    const negativeKeywords = ['skeptical', 'scrutiny', 'concerns', 'issues', 'false positives'];
    let highlighted = content;
    negativeKeywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-red-100 text-red-800 px-1 rounded">$1</mark>');
    });
    return highlighted;
  };
  return <motion.div layout initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} whileHover={{
    y: -2
  }} onHoverStart={() => setShowActions(true)} onHoverEnd={() => setShowActions(false)} className={cn('bg-white rounded-xl border shadow-sm transition-all', post.riskScore >= 7 ? 'border-red-200 shadow-red-100/50' : 'border-gray-200')}>
      {/* Card Header */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className={cn('w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center', platformColor)}>
            <PlatformIcon size={16} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[#0F1C2E]">{post.source}</span>
              {post.verified && <Shield size={14} className="text-[#1F9D8A]" fill="currentColor" />}
              {post.handle && <span className="text-sm text-gray-500">{post.handle}</span>}
            </div>
            <span className="text-xs text-gray-400">{post.timestamp}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <RiskScoreBadge score={post.riskScore} pulse={post.riskScore >= 7} />
          <button onClick={onSelect} className="p-1 text-gray-400 hover:text-[#1F9D8A] transition-colors" title="View Details">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-6 pb-4">
        <p className="text-[#0F1C2E] leading-relaxed" dangerouslySetInnerHTML={{
        __html: highlightContent(post.content)
      }} />
        
        {/* Media Display */}
        {hasMedia && (
          <div className="mt-3 space-y-2">
            {post.mediaUrls?.map((url, index) => {
              const mediaType = post.mediaTypes?.[index] || 'image';
              const isVideo = mediaType === 'video';
              
              return (
                <div key={index} className="rounded-lg overflow-hidden border border-gray-200 inline-block max-w-xs">
                  {isVideo ? (
                    <video
                      src={url}
                      controls
                      className="max-h-32 max-w-xs rounded-lg object-contain bg-gray-100"
                      poster={post.thumbnailUrl}
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Post media ${index + 1}`}
                      className="max-h-32 max-w-xs rounded-lg object-cover bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(url, '_blank')}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {post.thumbnailUrl && !hasMedia && (
          <div className="mt-3">
            <img
              src={post.thumbnailUrl}
              alt="Post thumbnail"
              className="rounded-lg max-h-32 max-w-xs object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(post.thumbnailUrl!, '_blank')}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Card Meta Row */}
      <div className="px-6 pb-4 flex flex-wrap items-center gap-2">
        <SentimentBadge sentiment={post.sentiment} />
        <SeverityBadge severity={post.severity} />
        {post.narrative && <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
            📖 {post.narrative}
          </span>}
        {post.topics.map((topic, idx) => <span key={idx} className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-[10px] font-medium hover:bg-gray-200 transition-colors cursor-pointer">
            {topic}
          </span>)}
        <div className="flex items-center space-x-3 ml-auto text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <ThumbsUp size={12} />
            <span>{post.engagement.likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Share2 size={12} />
            <span>{post.engagement.shares}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle size={12} />
            <span>{post.engagement.comments}</span>
          </div>
          <span>•</span>
          <span>Reach: {post.reach}</span>
          {post.velocity === 'rising' && <div className="flex items-center space-x-1 text-[#F59E0B]">
              <TrendingUp size={12} />
              <span className="font-semibold">Rising</span>
            </div>}
        </div>
      </div>

      {/* Card Footer Actions */}
      <AnimatePresence>
        {showActions && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: 'auto'
      }} exit={{
        opacity: 0,
        height: 0
      }} className="border-t border-gray-100 px-6 py-3">
          </motion.div>}
      </AnimatePresence>

      {/* AI Confidence Indicator */}
      <div className="px-6 pb-3">
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span>AI Confidence: {post.aiConfidence}%</span>
          <button className="hover:text-[#1F9D8A] flex items-center space-x-1 transition-colors group">
            <span className="group-hover:underline">Why is this risky?</span>
            <Eye size={10} />
          </button>
        </div>
      </div>
    </motion.div>;
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

// Main Feeds Page Component
export const FeedsPage = () => {
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '24h',
    platforms: [],
    sentiments: [],
    riskScores: [],
    searchQuery: ''
  });
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);

  // Load posts on mount and when filters/sort change (reset pagination)
  useEffect(() => {
    setCurrentOffset(0);
    setHasMore(true);
    loadPosts(false); // Always reload from start when filters change
  }, [filters.platforms, filters.sentiments, filters.riskScores, filters.dateRange, sortBy]);

  // Also reload when search query changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentOffset(0);
      setHasMore(true);
      loadPosts(false); // Reset and reload when search changes
    }, 300); // Debounce search by 300ms
    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  // Reset translated content when selected post changes
  useEffect(() => {
    setTranslatedContent(null);
  }, [selectedPost?.id]);

  const loadPosts = async (append: boolean = false) => {
    if (!append) {
      setLoading(true);
      setCurrentOffset(0);
    }
    setError(null);
    try {
      // Load ALL posts (no configuration filter) - show everything
      const offset = append ? currentOffset : 0;
      const fetchedPosts = await PostsApi.getAll({
        configuration_id: undefined, // Always show all posts, not filtered by configuration
        platform: filters.platforms.length === 1 ? filters.platforms[0] : undefined,
        limit: 500, // Load 500 posts at a time
        offset: offset,
        sort: sortBy === 'latest' ? 'created_at' : sortBy === 'risk' ? 'risk_score' : 'created_at',
        order: 'desc',
      });

      const feedPosts = fetchedPosts.map(mapPostToFeedPost);
      
      if (append) {
        // Append new posts to existing ones (avoid duplicates)
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = feedPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
        setCurrentOffset(prev => prev + fetchedPosts.length);
      } else {
        // Replace all posts
        setPosts(feedPosts);
        setCurrentOffset(fetchedPosts.length);
      }
      
      // Check if there are more posts to load (if we got exactly the limit, there might be more)
      setHasMore(fetchedPosts.length >= 500);
      
      // Log platform breakdown for debugging
      const platformCounts = feedPosts.reduce((acc: any, post: any) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
      }, {});
      console.log(`[FeedsPage] Loaded ${feedPosts.length} posts (${append ? 'appended' : 'replaced'}). Platform breakdown:`, platformCounts);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
      if (!append) {
        setPosts(MOCK_POSTS);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const loadMorePosts = () => {
    if (!loading && hasMore) {
      loadPosts(true);
    }
  };

  const filteredPosts = posts.filter(post => {
    // Platform filter
    if (filters.platforms.length > 0 && !filters.platforms.includes(post.platform)) {
      return false;
    }
    
    // Sentiment filter
    if (filters.sentiments.length > 0 && !filters.sentiments.includes(post.sentiment)) {
      return false;
    }
    
    // Risk score filter (High Risk >=7)
    if (filters.riskScores.includes('high-risk') && post.riskScore < 7) {
      return false;
    }
    
    // Date range filter (Last 24h)
    if (filters.dateRange === '24h') {
      const postDate = new Date(post.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
      if (isNaN(hoursDiff) || hoursDiff > 24 || hoursDiff < 0) {
        return false;
      }
    }
    
    // Search query filter
    if (filters.searchQuery && !post.content.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-0">
      {/* Top Context & Control Bar (Sticky) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search keywords, entities, handles, narratives..." value={filters.searchQuery} onChange={e => setFilters({
            ...filters,
            searchQuery: e.target.value
          })} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1F9D8A] focus:border-transparent transition-all outline-none" />
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Filters */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <Filter size={16} className="text-gray-500" />

            {/* Date Range */}
            <div className="relative group">
              <button 
                onClick={() => {
                  const newDateRange = filters.dateRange === '24h' ? 'all' : '24h';
                  setFilters({ ...filters, dateRange: newDateRange });
                }}
                className={cn(
                  "flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  filters.dateRange === '24h' 
                    ? "bg-[#1F9D8A] text-white border-[#1F9D8A]" 
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#1F9D8A]"
                )}
              >
                <Calendar size={12} />
                <span>Last 24h</span>
                <ChevronDown size={12} />
              </button>
            </div>

            {/* Platform Filters */}
            <FilterChip 
              label="Twitter" 
              active={filters.platforms.includes('twitter')} 
              onClick={() => {
                const newPlatforms = filters.platforms.includes('twitter' as Platform)
                  ? filters.platforms.filter(p => p !== 'twitter')
                  : [...filters.platforms, 'twitter' as Platform];
                setFilters({ ...filters, platforms: newPlatforms as Platform[] });
              }} 
            />
            <FilterChip 
              label="News" 
              active={filters.platforms.includes('news')} 
              onClick={() => {
                const newPlatforms = filters.platforms.includes('news' as Platform)
                  ? filters.platforms.filter(p => p !== 'news')
                  : [...filters.platforms, 'news' as Platform];
                setFilters({ ...filters, platforms: newPlatforms as Platform[] });
              }} 
            />
            <FilterChip 
              label="Reddit" 
              active={filters.platforms.includes('reddit')} 
              onClick={() => {
                const newPlatforms = filters.platforms.includes('reddit' as Platform)
                  ? filters.platforms.filter(p => p !== 'reddit')
                  : [...filters.platforms, 'reddit' as Platform];
                setFilters({ ...filters, platforms: newPlatforms as Platform[] });
              }} 
            />

            {/* Sentiment Filters */}
            <div className="h-4 w-px bg-gray-300 mx-1" />
            <FilterChip 
              label="Negative" 
              active={filters.sentiments.includes('negative')} 
              onClick={() => {
                const newSentiments = filters.sentiments.includes('negative' as Sentiment)
                  ? filters.sentiments.filter(s => s !== 'negative')
                  : [...filters.sentiments, 'negative' as Sentiment];
                setFilters({ ...filters, sentiments: newSentiments as Sentiment[] });
              }} 
            />
            <FilterChip 
              label="High Risk (>=7)" 
              active={filters.riskScores.includes('high-risk')} 
              onClick={() => {
                const newRiskScores = filters.riskScores.includes('high-risk')
                  ? filters.riskScores.filter(r => r !== 'high-risk')
                  : [...filters.riskScores, 'high-risk'];
                setFilters({ ...filters, riskScores: newRiskScores });
              }} 
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            {/* Post Count */}
            {!initialLoading && !loading && (
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="font-semibold text-[#0F1C2E]">{filteredPosts.length}</span> {filteredPosts.length === 1 ? 'post' : 'posts'}
                {posts.length !== filteredPosts.length && (
                  <span className="text-gray-400"> (of {posts.length} total)</span>
                )}
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-medium">Sort:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="text-xs font-semibold text-[#0F1C2E] bg-transparent border-none focus:ring-0 cursor-pointer">
                <option value="latest">Latest</option>
                <option value="risk">Highest Risk</option>
                <option value="engagement">Most Engagement</option>
                <option value="velocity">Fastest Amplifying</option>
              </select>
            </div>

            {/* Manual Refresh */}
            <button
              onClick={() => loadPosts(false)}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50"
              title="Refresh posts"
            >
              <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feed Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {initialLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <Loader2 size={48} className="animate-spin text-[#1F9D8A]" />
                <motion.div
                  className="absolute inset-0 border-4 border-[#1F9D8A] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center"
              >
                <h3 className="text-lg font-semibold text-[#0F1C2E] mb-2">Fetching Posts</h3>
                <p className="text-sm text-gray-600">Monitoring is active. Fetching posts from all platforms...</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#1F9D8A] rounded-full animate-pulse" />
                    <span>Twitter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#1F9D8A] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span>Reddit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#1F9D8A] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    <span>Facebook</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#1F9D8A] rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                    <span>News</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {!initialLoading && loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#1F9D8A]" />
              <span className="ml-3 text-gray-600">Refreshing posts...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-600" />
                <div>
                  <span className="text-red-700 font-medium">{error}</span>
                  <p className="text-red-600 text-sm mt-1">Please try refreshing or check your connection.</p>
                </div>
              </div>
              <button
                onClick={() => loadPosts(false)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Retry
              </button>
            </div>
          )}

          {!initialLoading && !loading && !error && filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rss size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F1C2E] mb-2">No Posts Yet</h3>
                <p className="text-gray-500 mb-4">Posts will appear here as they are fetched from the selected platforms.</p>
                <p className="text-sm text-gray-400">The system fetches posts every 10 minutes automatically.</p>
              </div>
            </div>
          )}

          {!loading && filteredPosts.map(post => (
            <FeedCard
              key={post.id}
              post={post}
              onExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              onSelect={() => setSelectedPost(post)}
            />
          ))}

          {/* Load More Button */}
          {!initialLoading && !loading && hasMore && filteredPosts.length > 0 && (
            <div className="flex justify-center py-8">
              <button
                onClick={loadMorePosts}
                disabled={loading}
                className="px-6 py-3 bg-[#1F9D8A] text-white rounded-lg font-semibold hover:bg-[#188976] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Load More Posts</span>
              </button>
            </div>
          )}

          {/* End of Posts Message */}
          {!initialLoading && !loading && !hasMore && filteredPosts.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-gray-500 text-sm">
                <CheckCircle size={16} className="text-green-500" />
                <span>All posts loaded. Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
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
              {/* Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#0F1C2E]">Post Analysis</h2>
                  <button
                    onClick={() => {
                      setSelectedPost(null);
                      setTranslatedContent(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XIcon size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">

            {/* Post Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-semibold text-[#0F1C2E]">{selectedPost.source}</span>
                {selectedPost.verified && <Shield size={14} className="text-[#1F9D8A]" fill="currentColor" />}
              </div>
              <p className="text-sm text-gray-600">{translatedContent || selectedPost.content}</p>
              <div className="mt-2 flex items-center space-x-2">
                <RiskScoreBadge score={selectedPost.riskScore} />
                <SentimentBadge sentiment={selectedPost.sentiment} />
              </div>
              {/* Translate Button */}
              <div className="mt-4">
                <button 
                  onClick={async () => {
                    if (isTranslating) return;
                    setIsTranslating(true);
                    setTranslatedContent(null);
                    try {
                      const result = await PostsApi.translate(selectedPost.id);
                      setTranslatedContent(result.translatedText);
                    } catch (error: any) {
                      console.error('Translation error:', error);
                      alert('Translation failed: ' + (error.message || 'Unknown error'));
                    } finally {
                      setIsTranslating(false);
                    }
                  }}
                  disabled={isTranslating}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-[#1F9D8A] rounded-lg hover:bg-[#188976] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Translating...</span>
                    </>
                  ) : (
                    <>
                      <Languages size={16} />
                      <span>Translate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Topics */}
            {selectedPost.topics && selectedPost.topics.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#0F1C2E] mb-3">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPost.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {selectedPost.keywords && selectedPost.keywords.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#0F1C2E] mb-3">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPost.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Crisp Summary */}
            {selectedPost.narrative && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#0F1C2E] mb-3">Summary</h3>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 italic">{selectedPost.narrative}</p>
                </div>
              </div>
            )}

            {/* Fact Check Data */}
            {selectedPost.factCheckData ? (
              <>
                {/* Evidence Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#0F1C2E] mb-3">Evidence</h3>
                  <div className="space-y-3">
                    {selectedPost.factCheckData.evidence.sources.map((source, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline mb-1 block"
                        >
                          {source.title}
                        </a>
                        <p className="text-xs text-gray-600 line-clamp-2">{source.snippet}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs font-semibold text-gray-700">Verification: </span>
                    <span className={`text-xs font-medium ${
                      selectedPost.factCheckData.truth_status === 'true' ? 'text-green-600' :
                      selectedPost.factCheckData.truth_status === 'false' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {selectedPost.factCheckData.truth_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Admin Response Section - Highlighted for High-Risk Posts */}
                <div className={`mb-6 ${selectedPost.riskScore >= 7 ? 'border-2 border-red-200 rounded-lg p-4 bg-red-50/50' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#0F1C2E]">Admin Response</h3>
                    {selectedPost.riskScore >= 7 && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">
                        High Priority
                      </span>
                    )}
                  </div>
                  <div className="p-4 bg-[#1F9D8A]/10 rounded-lg border border-[#1F9D8A]/20">
                    <div className="mb-3 p-3 bg-white rounded-lg border border-[#1F9D8A]/30">
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">
                        {selectedPost.factCheckData?.admin_response?.response_text}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">
                        Character count: {selectedPost.factCheckData?.admin_response?.response_text?.length || 0}/280
                      </span>
                      <button
                        onClick={() => {
                          if (selectedPost.factCheckData?.admin_response?.response_text) {
                            navigator.clipboard.writeText(selectedPost.factCheckData.admin_response.response_text);
                          }
                        }}
                        className="text-xs text-[#1F9D8A] hover:text-[#0F1C2E] font-medium"
                      >
                        Copy Response
                      </button>
                    </div>
                    {selectedPost.factCheckData.admin_response.key_points && selectedPost.factCheckData.admin_response.key_points.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Key Points:</p>
                        <ul className="space-y-1">
                          {selectedPost.factCheckData.admin_response.key_points.map((point, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start">
                              <span className="text-[#1F9D8A] mr-2">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                {selectedPost.riskScore >= 7 ? (
                  <div className="space-y-2">
                    <Loader2 className="animate-spin mx-auto mb-2 text-[#1F9D8A]" size={24} />
                    <p className="font-medium">Fact-checking in progress...</p>
                    <p className="text-xs">This post will be analyzed and an admin response will be generated shortly.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AlertTriangle className="mx-auto mb-2 text-gray-400" size={24} />
                    <p>Fact-checking available for posts with risk score &gt;= 7</p>
                    <p className="text-xs">This post has a risk score of {selectedPost.riskScore.toFixed(1)}</p>
                  </div>
                )}
              </div>
            )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>;
};