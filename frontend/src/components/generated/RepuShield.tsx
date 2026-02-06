import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Rss, Tag, MessageSquare, Settings, Search, PenSquare, ShieldAlert, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, Bell, Menu, X, MoreVertical, ArrowUpRight, Target, BarChart3, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { FeedsPage } from './FeedsPage';
import { TopicsPage } from './TopicsPage';
import { NarrativesPage } from './NarrativesPage';
import { ResearchPage } from './ResearchPage';
import { ComposePage } from './ComposePage';
import { ConfigurationPage } from './ConfigurationPage';
import { DashboardApi, type DashboardStats, type SentimentTrend, type PriorityNarrative, type SourceChannel, type RecentPost, type RiskDistribution } from '../../services/dashboardApi';
import { ConfigurationApi } from '../../services/configurationApi';

// Types
type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

// Constants & Mock Data
const NAV_ITEMS: NavItem[] = [{
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard
}, {
  id: 'feed',
  label: 'Feed',
  icon: Rss
}, {
  id: 'topics',
  label: 'Topics',
  icon: Tag
}, {
  id: 'narratives',
  label: 'Narratives',
  icon: MessageSquare
}, {
  id: 'research',
  label: 'Research',
  icon: Search
}, {
  id: 'compose',
  label: 'Compose',
  icon: PenSquare
}, {
  id: 'configuration',
  label: 'Configuration',
  icon: Settings
}, {
  id: 'admin',
  label: 'Admin',
  icon: ShieldAlert
}];
const SENTIMENT_DATA = [{
  name: 'Mon',
  positive: 65,
  neutral: 20,
  negative: 15
}, {
  name: 'Tue',
  positive: 72,
  neutral: 18,
  negative: 10
}, {
  name: 'Wed',
  positive: 58,
  neutral: 25,
  negative: 17
}, {
  name: 'Thu',
  positive: 80,
  neutral: 15,
  negative: 5
}, {
  name: 'Fri',
  positive: 85,
  neutral: 10,
  negative: 5
}, {
  name: 'Sat',
  positive: 75,
  neutral: 20,
  negative: 5
}, {
  name: 'Sun',
  positive: 70,
  neutral: 20,
  negative: 10
}];
const TOP_NARRATIVES: Array<{
  id: number;
  title: string;
  volume: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  change: string;
}> = [{
  id: 1,
  title: "Product Reliability Issues",
  volume: 1250,
  sentiment: 'negative' as const,
  change: '+12%'
}, {
  id: 2,
  title: "CEO Thought Leadership",
  volume: 850,
  sentiment: 'positive' as const,
  change: '+5%'
}, {
  id: 3,
  title: "Market Expansion Rumors",
  volume: 2100,
  sentiment: 'neutral' as const,
  change: '+45%'
}, {
  id: 4,
  title: "Sustainability Initiatives",
  volume: 620,
  sentiment: 'positive' as const,
  change: '-2%'
}];
const COLORS = {
  primary: '#0F1C2E',
  secondary: '#1F9D8A',
  accent: '#F59E0B',
  negative: '#DC2626',
  background: '#F8FAFC',
  card: '#FFFFFF'
};

// Components
const StatCard = ({
  title,
  value,
  trend,
  trendType
}: {
  title: string;
  value: string;
  trend: string;
  trendType: 'up' | 'down';
}) => <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</p>
      <div className={cn("flex items-center text-xs font-bold px-2 py-1 rounded-full", trendType === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
        {trendType === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
        {trend}
      </div>
    </div>
    <h3 className="text-3xl font-bold text-[#0F1C2E]">{value}</h3>
  </div>;
const NarrativeRow = ({
  narrative,
  onClick
}: {
  narrative: {
    id: string | number;
    title: string;
    volume: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    change: string;
  };
  onClick?: () => void;
}) => <div 
    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex items-center space-x-4">
      <div className={cn("w-2 h-12 rounded-full", narrative.sentiment === 'positive' ? "bg-[#1F9D8A]" : narrative.sentiment === 'negative' ? "bg-[#DC2626]" : "bg-gray-300")} />
      <div>
        <h4 className="font-semibold text-[#0F1C2E] group-hover:text-[#1F9D8A] transition-colors">{narrative.title}</h4>
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <span>{narrative.volume.toLocaleString()} mentions</span>
          <span className="flex items-center text-[#F59E0B]">
            <ArrowUpRight size={14} className="mr-1" />
            {narrative.change}
          </span>
        </div>
      </div>
    </div>
    <div className="text-gray-400 group-hover:text-[#1F9D8A] p-2 transition-colors">
      <ChevronRight size={20} />
    </div>
  </div>;

// @component: RepuShield
export const RepuShield = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedTopicFilter, setFeedTopicFilter] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [priorityNarratives, setPriorityNarratives] = useState<PriorityNarrative[]>([]);
  const [sourceChannels, setSourceChannels] = useState<SourceChannel[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [sentimentRange, setSentimentRange] = useState<'7d' | '30d' | 'quarter' | 'total'>('7d');
  const [configurationId, setConfigurationId] = useState<string | null>(null);
  const [activeConfiguration, setActiveConfiguration] = useState<any | null>(null);

  // Load dashboard data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab, sentimentRange]);

  // Auto-refresh real-time feed and priority narratives every 30 seconds
  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    
    const refreshInterval = setInterval(() => {
      refreshRecentPosts();
      refreshPriorityNarratives();
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [activeTab]);

  // Load active configuration
  useEffect(() => {
    loadActiveConfiguration();
  }, []);

  const loadActiveConfiguration = async () => {
    try {
      // First try to get active configuration
      const activeConfig = await ConfigurationApi.getActive();
      if (activeConfig) {
        setConfigurationId(activeConfig.id);
        setActiveConfiguration({ ...activeConfig, _isActive: true });
      } else {
        // If no active config, get the most recent one
        const allConfigs = await ConfigurationApi.getAll();
        if (allConfigs && allConfigs.length > 0) {
          // Sort by updatedAt to get the most recent
          const sortedConfigs = allConfigs.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          const mostRecent = sortedConfigs[0];
          setConfigurationId(mostRecent.id);
          setActiveConfiguration({ ...mostRecent, _isActive: false });
        }
      }
    } catch (err) {
      console.error('Error loading configuration:', err);
    }
  };

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    try {
      // Dashboard shows OVERALL data (all configurations), not filtered by configuration
      // Stats and trends are filtered by the selected time range
      const [stats, trends, narratives, channels, posts, riskDist] = await Promise.all([
        DashboardApi.getStats(sentimentRange, undefined), // Filter by selected time range
        DashboardApi.getSentimentTrends(sentimentRange, undefined), // Sentiment trends filtered by range
        DashboardApi.getPriorityNarratives(4, undefined), // No configuration filter
        DashboardApi.getSourceChannels(undefined), // No configuration filter
        DashboardApi.getRecentPosts(5, undefined), // Show only latest 5 posts
        DashboardApi.getRiskDistribution(undefined), // No configuration filter
      ]);

      setDashboardStats(stats);
      setSentimentTrends(trends);
      setPriorityNarratives(narratives);
      setSourceChannels(channels.channels);
      setRecentPosts(posts);
      setRiskDistribution(riskDist);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Refresh only recent posts (for real-time feed auto-update)
  const refreshRecentPosts = async () => {
    try {
      const posts = await DashboardApi.getRecentPosts(5, undefined);
      setRecentPosts(posts);
    } catch (error) {
      console.error('Error refreshing recent posts:', error);
    }
  };

  // Refresh priority narratives
  const refreshPriorityNarratives = async () => {
    try {
      const narratives = await DashboardApi.getPriorityNarratives(4, undefined);
      setPriorityNarratives(narratives);
    } catch (error) {
      console.error('Error refreshing priority narratives:', error);
    }
  };

  // Navigate to narratives page when clicking a narrative
  const handleNarrativeClick = (narrativeId: string | number) => {
    setActiveTab('narratives');
  };

  // @return
  return <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden font-sans text-[#0F1C2E]">
      {/* Sidebar */}
      <motion.aside initial={false} animate={{
      width: sidebarOpen ? 260 : 80
    }} className="h-full bg-[#0F1C2E] text-white flex flex-col shrink-0 relative z-20">
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#1F9D8A] rounded-lg flex items-center justify-center font-bold text-lg">R</div>
              <span className="font-bold text-xl tracking-tight">RepuShield</span>
            </div>}
          {!sidebarOpen && <div className="w-8 h-8 bg-[#1F9D8A] rounded-lg flex items-center justify-center font-bold text-lg mx-auto">R</div>}
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return <button key={item.id} onClick={() => setActiveTab(item.id)} className={cn("w-full flex items-center p-3 rounded-lg transition-all group", isActive ? "bg-[#1F9D8A] text-white" : "text-gray-400 hover:bg-gray-800/50 hover:text-white")}>
                <Icon size={20} className={cn(sidebarOpen ? "mr-3" : "mx-auto")} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                {isActive && sidebarOpen && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
              </button>;
        })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-[#0F1C2E] capitalize">
              {NAV_ITEMS.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 cursor-pointer p-1 pr-3 hover:bg-gray-100 rounded-full transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#0F1C2E] text-white flex items-center justify-center font-bold text-xs">
                JD
              </div>
              <span className="text-sm font-semibold">Jane Doe</span>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        {activeTab === 'feed' ? <FeedsPage topicFilter={feedTopicFilter} onClearTopicFilter={() => setFeedTopicFilter(null)} onBackToTopics={() => { setFeedTopicFilter(null); setActiveTab('topics'); }} /> : activeTab === 'topics' ? <TopicsPage onNavigateToFeed={(topicId) => { setFeedTopicFilter(topicId); setActiveTab('feed'); }} /> : activeTab === 'narratives' ? <NarrativesPage /> : activeTab === 'research' ? <ResearchPage /> : activeTab === 'compose' ? <ComposePage /> : activeTab === 'configuration' ? <ConfigurationPage onActivate={() => setActiveTab('feed')} /> : <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto space-y-8">

            {/* Configuration Context Bar */}
            {activeConfiguration ? (
              <div className={`border rounded-xl shadow-sm p-4 ${activeConfiguration._isActive ? 'bg-white border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* Configuration Name with Status */}
                    <div className="flex items-center space-x-3">
                      {activeConfiguration._isActive ? (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      )}
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider ${activeConfiguration._isActive ? 'text-gray-500' : 'text-amber-600'}`}>
                          {activeConfiguration._isActive ? 'Active Configuration' : 'Not Active'}
                        </p>
                        <p className="text-lg font-bold text-[#0F1C2E]">{activeConfiguration.entityDetails?.name || 'Unnamed Configuration'}</p>
                      </div>
                    </div>

                    <div className="h-10 w-px bg-gray-200" />

                    {/* Keywords Count */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium">Keywords</p>
                      <p className="text-lg font-bold text-[#0F1C2E]">
                        {(activeConfiguration.ontology?.coreKeywords?.length || 0) + 
                         (activeConfiguration.ontology?.associatedKeywords?.length || 0) + 
                         (activeConfiguration.ontology?.narrativeKeywords?.length || 0)}
                      </p>
                    </div>

                    <div className="h-10 w-px bg-gray-200" />

                    {/* Platforms */}
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Platforms</p>
                      <div className="flex items-center space-x-2">
                        {activeConfiguration.platformConfig?.platforms?.includes('twitter') && (
                          <span className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-[10px] font-bold">𝕏</span>
                        )}
                        {activeConfiguration.platformConfig?.platforms?.includes('reddit') && (
                          <span className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-[10px] font-bold">R</span>
                        )}
                        {activeConfiguration.platformConfig?.platforms?.includes('facebook') && (
                          <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">f</span>
                        )}
                        {activeConfiguration.platformConfig?.platforms?.includes('news') && (
                          <span className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-white text-[10px] font-bold">
                            <Globe size={12} />
                          </span>
                        )}
                        {(!activeConfiguration.platformConfig?.platforms || activeConfiguration.platformConfig.platforms.length === 0) && (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </div>
                    </div>

                    <div className="h-10 w-px bg-gray-200" />

                    {/* Last Updated */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium">Last Updated</p>
                      <p className="text-sm font-semibold text-[#0F1C2E]">
                        {activeConfiguration.updatedAt 
                          ? new Date(activeConfiguration.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Edit/Activate Button */}
                  <button 
                    onClick={() => setActiveTab('configuration')}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeConfiguration._isActive 
                        ? 'text-[#1F9D8A] hover:bg-[#1F9D8A]/10' 
                        : 'text-white bg-[#1F9D8A] hover:bg-[#188976]'
                    }`}
                  >
                    <Settings size={16} />
                    <span>{activeConfiguration._isActive ? 'Edit' : 'Activate'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Settings size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">No Configuration</p>
                      <p className="text-sm text-gray-600">Create a monitoring configuration to start tracking</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('configuration')}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-[#1F9D8A] hover:bg-[#188976] rounded-lg transition-colors"
                  >
                    <Settings size={16} />
                    <span>Create Configuration</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Summary Row */}
            <section className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
                {dashboardLoading ? (
                  <>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                  </>
                ) : dashboardStats ? (
                  <>
                    <StatCard 
                      title="Reputation Score" 
                      value={`${dashboardStats.reputationScore.value}/100`} 
                      trend={`${dashboardStats.reputationScore.trend >= 0 ? '+' : ''}${dashboardStats.reputationScore.trend.toFixed(1)}%`} 
                      trendType={dashboardStats.reputationScore.trend >= 0 ? 'up' : 'down'} 
                    />
                    <StatCard 
                      title="Total Mentions" 
                      value={dashboardStats.totalMentions.value.toLocaleString()} 
                      trend={`${dashboardStats.totalMentions.trend >= 0 ? '+' : ''}${dashboardStats.totalMentions.trend.toFixed(1)}%`} 
                      trendType={dashboardStats.totalMentions.trend >= 0 ? 'up' : 'down'} 
                    />
                    <StatCard 
                      title="Critical Alerts" 
                      value={dashboardStats.criticalAlerts.value.toString().padStart(2, '0')} 
                      trend={`${dashboardStats.criticalAlerts.trend >= 0 ? '+' : ''}${dashboardStats.criticalAlerts.trend.toFixed(1)}%`} 
                      trendType={dashboardStats.criticalAlerts.trend >= 0 ? 'up' : 'down'} 
                    />
                  </>
                ) : (
                  <>
                    <StatCard title="Reputation Score" value="0/100" trend="0%" trendType="up" />
                    <StatCard title="Total Mentions" value="0" trend="0%" trendType="up" />
                    <StatCard title="Critical Alerts" value="00" trend="0%" trendType="up" />
                  </>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sentiment Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold">Sentiment Overview</h3>
                    <p className="text-sm text-gray-500">Weekly breakdown of narrative sentiment</p>
                  </div>
                  <select 
                    value={sentimentRange === '7d' ? 'Last 7 Days' : sentimentRange === '30d' ? 'Last 30 Days' : sentimentRange === 'quarter' ? 'Last Quarter' : 'Total'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'Last 7 Days') setSentimentRange('7d');
                      else if (value === 'Last 30 Days') setSentimentRange('30d');
                      else if (value === 'Last Quarter') setSentimentRange('quarter');
                      else setSentimentRange('total');
                    }}
                    className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 focus:ring-[#1F9D8A] focus:border-[#1F9D8A]"
                  >
                    <option>Total</option>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last Quarter</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sentimentTrends.length > 0 ? sentimentTrends : SENTIMENT_DATA}>
                      <defs>
                        <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1F9D8A" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#1F9D8A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DC2626" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
                      fill: '#6B7280',
                      fontSize: 12
                    }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{
                      fill: '#6B7280',
                      fontSize: 12
                    }} />
                      <Tooltip contentStyle={{
                      backgroundColor: '#FFF',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} />
                      <Area type="monotone" dataKey="positive" stroke="#1F9D8A" fillOpacity={1} fill="url(#colorPos)" strokeWidth={3} />
                      <Area type="monotone" dataKey="negative" stroke="#DC2626" fillOpacity={1} fill="url(#colorNeg)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Emerging Threats / Critical Alerts */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">Priority Narratives</h3>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 rounded-full">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    </div>
                  </div>
                  <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">High Risk</span>
                </div>
                <div className="flex-1 space-y-4">
                  {priorityNarratives.length > 0 ? (
                    priorityNarratives.map(narrative => (
                      <NarrativeRow 
                        key={narrative.id} 
                        narrative={{
                          id: narrative.id,
                          title: narrative.title,
                          volume: narrative.volume,
                          sentiment: narrative.sentiment,
                          change: `${narrative.change >= 0 ? '+' : ''}${narrative.change.toFixed(1)}%`
                        }}
                        onClick={() => handleNarrativeClick(narrative.id)}
                      />
                    ))
                  ) : (
                    TOP_NARRATIVES.map(narrative => <NarrativeRow key={narrative.id} narrative={narrative} onClick={() => setActiveTab('narratives')} />)
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab('narratives')}
                  className="mt-6 w-full py-2 bg-gray-50 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 hover:text-[#1F9D8A] transition-colors text-sm flex items-center justify-center"
                >
                  View Full Report <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>

            {/* Risk Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Risk Score Distribution</h3>
                    <p className="text-sm text-gray-500">Distribution of posts by risk level</p>
                  </div>
                  {riskDistribution && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#0F1C2E]">{riskDistribution.averageRisk.toFixed(1)}</p>
                      <p className="text-xs text-gray-500">Avg. Risk Score</p>
                    </div>
                  )}
                </div>
                <div className="h-[250px] w-full">
                  {dashboardLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-pulse text-gray-400">Loading...</div>
                    </div>
                  ) : riskDistribution && riskDistribution.distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskDistribution.distribution} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis 
                          type="category" 
                          dataKey="label" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          width={70}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#FFF',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          formatter={(value: number, name: string, props: any) => [
                            `${value} posts (${props.payload.percentage}%)`,
                            'Count'
                          ]}
                        />
                        <Bar 
                          dataKey="count" 
                          radius={[0, 4, 4, 0]}
                        >
                          {riskDistribution.distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No risk data available
                    </div>
                  )}
                </div>
                {riskDistribution && riskDistribution.total > 0 && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      {riskDistribution.distribution.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                          <span className="text-gray-600 text-xs">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-gray-500 text-xs">{riskDistribution.total} total posts</span>
                  </div>
                )}
              </div>

              {/* Risk Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                {riskDistribution && riskDistribution.distribution.length > 0 ? (
                  <>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-medium text-emerald-800">Low Risk</span>
                      </div>
                      <p className="text-3xl font-bold text-emerald-700">
                        {riskDistribution.distribution.find(d => d.range === '0-2')?.count || 0}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        {riskDistribution.distribution.find(d => d.range === '0-2')?.percentage || 0}% of posts
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-sm font-medium text-amber-800">Medium Risk</span>
                      </div>
                      <p className="text-3xl font-bold text-amber-700">
                        {riskDistribution.distribution.find(d => d.range === '3-4')?.count || 0}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        {riskDistribution.distribution.find(d => d.range === '3-4')?.percentage || 0}% of posts
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-medium text-orange-800">High Risk</span>
                      </div>
                      <p className="text-3xl font-bold text-orange-700">
                        {(riskDistribution.distribution.find(d => d.range === '5-6')?.count || 0) +
                         (riskDistribution.distribution.find(d => d.range === '7-8')?.count || 0)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {(riskDistribution.distribution.find(d => d.range === '5-6')?.percentage || 0) +
                         (riskDistribution.distribution.find(d => d.range === '7-8')?.percentage || 0)}% of posts
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-600"></div>
                        <span className="text-sm font-medium text-red-800">Critical</span>
                      </div>
                      <p className="text-3xl font-bold text-red-700">
                        {riskDistribution.distribution.find(d => d.range === '9-10')?.count || 0}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {riskDistribution.distribution.find(d => d.range === '9-10')?.percentage || 0}% of posts
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Media Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Source Channels</h3>
                <div className="space-y-4">
                  {(sourceChannels.length > 0 ? sourceChannels.map(ch => ({
                    label: ch.label,
                    value: ch.value,
                    color: ch.label === 'Social Media' ? '#1F9D8A' : 
                           ch.label === 'News Outlets' ? '#0F1C2E' : 
                           ch.label === 'Forums & Blogs' ? '#F59E0B' : '#E5E7EB'
                  })) : [{
                  label: 'Social Media',
                  value: 65,
                  color: '#1F9D8A'
                }, {
                  label: 'News Outlets',
                  value: 20,
                  color: '#0F1C2E'
                }, {
                  label: 'Forums & Blogs',
                  value: 10,
                  color: '#F59E0B'
                }, {
                  label: 'Internal Comms',
                  value: 5,
                  color: '#E5E7EB'
                }]).map((item, i) => <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{item.label}</span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{
                      width: 0
                    }} animate={{
                      width: `${item.value}%`
                    }} transition={{
                      duration: 1,
                      delay: i * 0.1
                    }} className="h-full rounded-full" style={{
                      backgroundColor: item.color
                    }} />
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Latest Mentions Feed */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">Real-time Feed</h3>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase">Live</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); refreshRecentPosts(); }}
                    className="p-1.5 bg-gray-50 rounded text-gray-400 hover:text-[#1F9D8A] hover:bg-teal-50 transition-colors"
                    title="Refresh now"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  {recentPosts.length > 0 ? (
                    recentPosts.map((post, i) => (
                      <div 
                        key={post.id} 
                        className="flex gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-all cursor-pointer group"
                        onClick={() => window.open(post.postUrl, '_blank')}
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                          {post.platform === 'news' ? <Globe className="text-[#1F9D8A]" size={20} /> : <MessageSquare className="text-[#0F1C2E]" size={20} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm group-hover:text-[#1F9D8A] transition-colors">
                              {post.source}
                            </h4>
                            <span className="text-xs text-gray-400">{post.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center mt-3 space-x-4">
                            <span className={`text-[10px] font-bold uppercase ${
                              post.viralRisk === 'high' ? 'text-red-600' : 
                              post.viralRisk === 'medium' ? 'text-yellow-600' : 
                              'text-gray-400'
                            }`}>
                              Viral Risk: {post.viralRisk.charAt(0).toUpperCase() + post.viralRisk.slice(1)}
                            </span>
                            <span className={`text-[10px] font-bold uppercase ${
                              post.sentiment === 'positive' ? 'text-[#1F9D8A]' : 
                              post.sentiment === 'negative' ? 'text-red-600' : 
                              'text-gray-500'
                            }`}>
                              Sentiment: {post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <button className="text-gray-400 hover:text-[#1F9D8A] p-1"><MoreVertical size={16} /></button>
                        </div>
                      </div>
                    ))
                  ) : (
                    [1, 2, 3].map((_, i) => <div key={i} className="flex gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        {i === 0 ? <Globe className="text-[#1F9D8A]" size={20} /> : <MessageSquare className="text-[#0F1C2E]" size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm group-hover:text-[#1F9D8A] transition-colors">
                            {i === 0 ? "Global Finance Today" : "TechInsiders Community"}
                          </h4>
                          <span className="text-xs text-gray-400">2m ago</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {i === 0 ? "Analysis shows a 15% increase in positive sentiment regarding the new RepuShield implementation in enterprise environments..." : "Users on Reddit are discussing the recent narrative shift. The overall consensus remains neutral with potential for positive growth."}
                        </p>
                        <div className="flex items-center mt-3 space-x-4">
                          <span className="text-[10px] font-bold uppercase text-gray-400">Viral Risk: Low</span>
                          <span className="text-[10px] font-bold uppercase text-[#1F9D8A]">Sentiment: Positive</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <button className="text-gray-400 hover:text-[#1F9D8A] p-1"><MoreVertical size={16} /></button>
                      </div>
                    </div>)
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>}

        {/* Floating Quick Action Button */}
        <motion.button whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }} className="fixed bottom-8 right-8 w-14 h-14 bg-[#1F9D8A] text-white rounded-full shadow-lg shadow-teal-500/20 flex items-center justify-center group z-30">
          <PenSquare size={24} />
          <div className="absolute right-full mr-4 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[#0F1C2E]">
            Compose Report
          </div>
        </motion.button>
      </main>
    </div>;
};