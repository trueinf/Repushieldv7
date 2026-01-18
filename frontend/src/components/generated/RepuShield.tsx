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
import { DashboardApi, type DashboardStats, type SentimentTrend, type PriorityNarrative, type SourceChannel, type RecentPost } from '../../services/dashboardApi';
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
  narrative
}: {
  narrative: {
    id: string | number;
    title: string;
    volume: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    change: string;
  };
}) => <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
    <div className="flex items-center space-x-4">
      <div className={cn("w-2 h-12 rounded-full", narrative.sentiment === 'positive' ? "bg-[#1F9D8A]" : narrative.sentiment === 'negative' ? "bg-[#DC2626]" : "bg-gray-300")} />
      <div>
        <h4 className="font-semibold text-[#0F1C2E]">{narrative.title}</h4>
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <span>{narrative.volume.toLocaleString()} mentions</span>
          <span className="flex items-center text-[#F59E0B]">
            <ArrowUpRight size={14} className="mr-1" />
            {narrative.change}
          </span>
        </div>
      </div>
    </div>
    <button className="text-gray-400 hover:text-gray-600 p-2">
      <ChevronRight size={20} />
    </button>
  </div>;

// @component: RepuShield
export const RepuShield = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [priorityNarratives, setPriorityNarratives] = useState<PriorityNarrative[]>([]);
  const [sourceChannels, setSourceChannels] = useState<SourceChannel[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [sentimentRange, setSentimentRange] = useState<'7d' | '30d' | 'quarter'>('7d');
  const [configurationId, setConfigurationId] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab, sentimentRange]);

  // Load active configuration
  useEffect(() => {
    loadActiveConfiguration();
  }, []);

  const loadActiveConfiguration = async () => {
    try {
      const config = await ConfigurationApi.getActive();
      if (config) {
        setConfigurationId(config.id);
      }
    } catch (err) {
      console.error('Error loading configuration:', err);
    }
  };

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    try {
      // Dashboard shows OVERALL data (all configurations), not filtered by configuration
      const [stats, trends, narratives, channels, posts] = await Promise.all([
        DashboardApi.getStats(undefined), // No configuration filter - show overall
        DashboardApi.getSentimentTrends(sentimentRange, undefined), // No configuration filter
        DashboardApi.getPriorityNarratives(4, undefined), // No configuration filter
        DashboardApi.getSourceChannels(undefined), // No configuration filter
        DashboardApi.getRecentPosts(10, undefined), // No configuration filter
      ]);

      setDashboardStats(stats);
      setSentimentTrends(trends);
      setPriorityNarratives(narratives);
      setSourceChannels(channels.channels);
      setRecentPosts(posts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
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
            {activeTab !== 'feed' && <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search across narratives..." className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-[#1F9D8A] transition-all outline-none" />
              </div>}
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white" />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2" />
            <div className="flex items-center space-x-3 cursor-pointer p-1 pr-3 hover:bg-gray-100 rounded-full transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#0F1C2E] text-white flex items-center justify-center font-bold text-xs">
                JD
              </div>
              <span className="text-sm font-semibold">Jane Doe</span>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        {activeTab === 'feed' ? <FeedsPage /> : activeTab === 'topics' ? <TopicsPage /> : activeTab === 'narratives' ? <NarrativesPage /> : activeTab === 'research' ? <ResearchPage /> : activeTab === 'compose' ? <ComposePage /> : activeTab === 'configuration' ? <ConfigurationPage onActivate={() => setActiveTab('feed')} /> : <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Summary Row */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <StatCard 
                    title="Response Time" 
                    value={`${dashboardStats.responseTime.value}m`} 
                    trend={`${dashboardStats.responseTime.trend >= 0 ? '+' : ''}${dashboardStats.responseTime.trend.toFixed(1)}%`} 
                    trendType={dashboardStats.responseTime.trend >= 0 ? 'up' : 'down'} 
                  />
                </>
              ) : (
                <>
                  <StatCard title="Reputation Score" value="0/100" trend="0%" trendType="up" />
                  <StatCard title="Total Mentions" value="0" trend="0%" trendType="up" />
                  <StatCard title="Critical Alerts" value="00" trend="0%" trendType="up" />
                  <StatCard title="Response Time" value="0m" trend="0%" trendType="up" />
                </>
              )}
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
                    value={sentimentRange === '7d' ? 'Last 7 Days' : sentimentRange === '30d' ? 'Last 30 Days' : 'Last Quarter'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'Last 7 Days') setSentimentRange('7d');
                      else if (value === 'Last 30 Days') setSentimentRange('30d');
                      else setSentimentRange('quarter');
                    }}
                    className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 focus:ring-[#1F9D8A] focus:border-[#1F9D8A]"
                  >
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
                  <h3 className="text-lg font-bold">Priority Narratives</h3>
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
                      />
                    ))
                  ) : (
                    TOP_NARRATIVES.map(narrative => <NarrativeRow key={narrative.id} narrative={narrative} />)
                  )}
                </div>
                <button className="mt-6 w-full py-2 bg-gray-50 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center justify-center">
                  View Full Report <ChevronRight size={16} className="ml-1" />
                </button>
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
                  <h3 className="text-lg font-bold">Real-time Feed</h3>
                  <div className="flex space-x-2">
                    <button className="p-1.5 bg-gray-50 rounded text-gray-400 hover:text-gray-600"><Globe size={18} /></button>
                    <button className="p-1.5 bg-gray-50 rounded text-gray-400 hover:text-gray-600"><BarChart3 size={18} /></button>
                  </div>
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