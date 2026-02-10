import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET /api/dashboard/stats - Overall statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { configuration_id, range = 'total' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'total':
      default:
        startDate = null; // No date filter
    }

    // Build base query
    let baseQuery = supabase.from('posts').select('*', { count: 'exact' });
    if (configuration_id) {
      baseQuery = baseQuery.eq('configuration_id', configuration_id as string);
    }
    if (startDate) {
      baseQuery = baseQuery.gte('created_at', startDate.toISOString());
    }

    // Get posts for calculations (filtered by range)
    const { data: posts, error, count } = await baseQuery;

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      return res.json({
        success: true,
        data: {
          reputationScore: { value: 0, max: 100, trend: 0 },
          totalMentions: { value: 0, trend: 0 },
          criticalAlerts: { value: 0, trend: 0 },
          responseTime: { value: 0, trend: 0 },
        },
      });
    }

    // Calculate Reputation Score (0-100)
    // Formula: Based on sentiment distribution and risk scores
    const positiveCount = posts.filter(p => p.sentiment === 'positive').length;
    const neutralCount = posts.filter(p => p.sentiment === 'neutral').length;
    const negativeCount = posts.filter(p => p.sentiment === 'negative').length;
    const totalCount = posts.length;

    const positiveWeight = positiveCount / totalCount;
    const neutralWeight = neutralCount / totalCount;
    const negativeWeight = negativeCount / totalCount;

    // Average risk score (lower is better for reputation)
    const avgRiskScore = posts
      .filter(p => p.risk_score !== null)
      .reduce((sum, p) => sum + (p.risk_score || 0), 0) / posts.filter(p => p.risk_score !== null).length || 0;

    // Reputation score: 100 - (negative_weight * 50) - (avg_risk_score * 5)
    // Higher positive sentiment and lower risk = higher reputation
    const reputationScore = Math.max(0, Math.min(100, 
      100 - (negativeWeight * 50) - (avgRiskScore * 5) + (positiveWeight * 20)
    ));

    // Total Mentions
    const totalMentions = count || posts.length;

    // Critical Alerts (risk_score >= 7)
    const criticalAlerts = posts.filter(p => p.risk_score !== null && p.risk_score >= 7).length;

    // Response Time (average time from post creation to fact-check completion, in minutes)
    // For posts with fact_check_data, calculate time difference
    const factCheckedPosts = posts.filter(p => p.fact_check_data !== null);
    let avgResponseTime = 0;
    
    if (factCheckedPosts.length > 0) {
      const responseTimes = factCheckedPosts
        .map(post => {
          const postCreated = new Date(post.created_at).getTime();
          const factChecked = new Date(post.fetched_at || post.created_at).getTime();
          return (factChecked - postCreated) / (1000 * 60); // Convert to minutes
        })
        .filter(time => time > 0);
      
      if (responseTimes.length > 0) {
        avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      }
    }

    // Calculate trends (compare current period with previous period of same length)
    // Determine period length based on range
    let periodDays: number;
    switch (range) {
      case '7d':
        periodDays = 7;
        break;
      case '30d':
        periodDays = 30;
        break;
      case 'quarter':
        periodDays = 90;
        break;
      case 'total':
      default:
        periodDays = 7; // Default to 7 days for trend calculation in total view
    }

    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - (periodDays * 2) * 24 * 60 * 60 * 1000);

    const recentPosts = posts.filter(p => new Date(p.created_at) >= periodStart);
    const previousPosts = posts.filter(p => {
      const postDate = new Date(p.created_at);
      return postDate >= previousPeriodStart && postDate < periodStart;
    });

    // Calculate trends
    const recentMentions = recentPosts.length;
    const previousMentions = previousPosts.length;
    const mentionsTrend = previousMentions > 0 
      ? ((recentMentions - previousMentions) / previousMentions) * 100 
      : 0;

    const recentCritical = recentPosts.filter(p => p.risk_score !== null && p.risk_score >= 7).length;
    const previousCritical = previousPosts.filter(p => p.risk_score !== null && p.risk_score >= 7).length;
    const criticalTrend = previousCritical > 0
      ? ((recentCritical - previousCritical) / previousCritical) * 100
      : 0;

    // Reputation trend (simplified)
    const recentReputation = recentPosts.length > 0
      ? recentPosts.filter(p => p.sentiment === 'positive').length / recentPosts.length * 100
      : 0;
    const previousReputation = previousPosts.length > 0
      ? previousPosts.filter(p => p.sentiment === 'positive').length / previousPosts.length * 100
      : 0;
    const reputationTrend = previousReputation > 0
      ? recentReputation - previousReputation
      : 0;

    res.json({
      success: true,
      data: {
        reputationScore: {
          value: Math.round(reputationScore),
          max: 100,
          trend: Math.round(reputationTrend * 10) / 10,
        },
        totalMentions: {
          value: totalMentions,
          trend: Math.round(mentionsTrend * 10) / 10,
        },
        criticalAlerts: {
          value: criticalAlerts,
          trend: Math.round(criticalTrend * 10) / 10,
        },
        responseTime: {
          value: Math.round(avgResponseTime),
          trend: -5.2, // Placeholder - can be calculated from historical data
        },
      },
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      message: error.message,
    });
  }
});

// GET /api/dashboard/sentiment-trends - Sentiment over time
router.get('/sentiment-trends', async (req: Request, res: Response) => {
  try {
    const { range = '7d', configuration_id } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'total':
        startDate = null; // No date filter - show all
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    let query = supabase
      .from('posts')
      .select('created_at, sentiment')
      .order('created_at', { ascending: true });
    
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (configuration_id) {
      query = query.eq('configuration_id', configuration_id as string);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Group by date and count sentiments
    const groupedByDate: Record<string, { positive: number; neutral: number; negative: number }> = {};

    posts.forEach(post => {
      const date = new Date(post.created_at).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = { positive: 0, neutral: 0, negative: 0 };
      }
      
      const sentiment = post.sentiment || 'neutral';
      if (sentiment === 'positive') {
        groupedByDate[date].positive++;
      } else if (sentiment === 'negative') {
        groupedByDate[date].negative++;
      } else {
        groupedByDate[date].neutral++;
      }
    });

    // Convert to array format with day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = Object.entries(groupedByDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, counts]) => {
        const dateObj = new Date(date);
        const dayName = dayNames[dateObj.getDay()];
        return {
          name: dayName,
          date: date,
          positive: counts.positive,
          neutral: counts.neutral,
          negative: counts.negative,
        };
      });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error fetching sentiment trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sentiment trends',
      message: error.message,
    });
  }
});

// GET /api/dashboard/priority-narratives - High-risk narratives
router.get('/priority-narratives', async (req: Request, res: Response) => {
  try {
    const { limit = 4, configuration_id } = req.query;

    let query = supabase
      .from('posts')
      .select('narrative, risk_score, sentiment, created_at')
      .not('narrative', 'is', null)
      .gte('risk_score', 7)
      .order('risk_score', { ascending: false });

    if (configuration_id) {
      query = query.eq('configuration_id', configuration_id as string);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Group by narrative
    const narrativeMap: Record<string, {
      volume: number;
      riskScores: number[];
      sentiments: string[];
      firstSeen: string;
      lastSeen: string;
    }> = {};

    posts.forEach(post => {
      const narrative = post.narrative || 'Unknown';
      if (!narrativeMap[narrative]) {
        narrativeMap[narrative] = {
          volume: 0,
          riskScores: [],
          sentiments: [],
          firstSeen: post.created_at,
          lastSeen: post.created_at,
        };
      }
      
      narrativeMap[narrative].volume++;
      if (post.risk_score) narrativeMap[narrative].riskScores.push(post.risk_score);
      if (post.sentiment) narrativeMap[narrative].sentiments.push(post.sentiment);
      
      if (new Date(post.created_at) < new Date(narrativeMap[narrative].firstSeen)) {
        narrativeMap[narrative].firstSeen = post.created_at;
      }
      if (new Date(post.created_at) > new Date(narrativeMap[narrative].lastSeen)) {
        narrativeMap[narrative].lastSeen = post.created_at;
      }
    });

    // Calculate trends (compare last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const narratives = Object.entries(narrativeMap)
      .map(([title, data]) => {
        // Determine dominant sentiment
        const sentimentCounts = data.sentiments.reduce((acc, s) => {
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const dominantSentiment = Object.entries(sentimentCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

        // Calculate change percentage (simplified - compare recent vs older)
        const recentPosts = posts.filter(p => 
          p.narrative === title && 
          new Date(p.created_at) >= sevenDaysAgo
        ).length;
        const previousPosts = posts.filter(p => 
          p.narrative === title &&
          new Date(p.created_at) >= fourteenDaysAgo &&
          new Date(p.created_at) < sevenDaysAgo
        ).length;

        const change = previousPosts > 0
          ? ((recentPosts - previousPosts) / previousPosts) * 100
          : recentPosts > 0 ? 100 : 0;

        return {
          id: title.toLowerCase().replace(/\s+/g, '-'),
          title: title,
          volume: data.volume,
          sentiment: dominantSentiment,
          change: Math.round(change * 10) / 10,
          avgRiskScore: data.riskScores.length > 0
            ? data.riskScores.reduce((sum, r) => sum + r, 0) / data.riskScores.length
            : 8,
        };
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: narratives,
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error fetching priority narratives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch priority narratives',
      message: error.message,
    });
  }
});

// GET /api/dashboard/source-channels - Platform distribution (by explicit platform)
router.get('/source-channels', async (req: Request, res: Response) => {
  try {
    const { configuration_id } = req.query;

    let query = supabase
      .from('posts')
      .select('platform');

    if (configuration_id) {
      query = query.eq('configuration_id', configuration_id as string);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      return res.json({
        success: true,
        data: {
          channels: [],
          total: 0,
        },
      });
    }

    const total = count || posts.length;

    // Count by explicit platform
    const platformCounts: Record<string, number> = {};
    posts.forEach(post => {
      const platform = (post as any).platform || 'unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    const platforms = ['twitter', 'reddit', 'facebook', 'news'];

    const channels = platforms
      .map(label => {
        const countForPlatform = platformCounts[label] || 0;
        return {
          label,
          value: total > 0 ? Math.round((countForPlatform / total) * 100) : 0,
          count: countForPlatform,
          platforms: [label],
        };
      })
      .filter(channel => channel.count > 0);

    res.json({
      success: true,
      data: {
        channels,
        total,
      },
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error fetching source channels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch source channels',
      message: error.message,
    });
  }
});

// GET /api/dashboard/recent-posts - Real-time feed
router.get('/recent-posts', async (req: Request, res: Response) => {
  try {
    const { limit = 10, configuration_id } = req.query;

    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (configuration_id) {
      query = query.eq('configuration_id', configuration_id as string);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Format posts for display
    const formattedPosts = posts.map(post => {
      // Calculate time ago
      const postDate = new Date(post.created_at);
      const now = new Date();
      const diffMs = now.getTime() - postDate.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let timeAgo = '';
      if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = `${diffDays}d ago`;
      }

      // Determine viral risk
      const engagement = (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0);
      const followers = post.author_followers || 0;
      const reach = followers + engagement;
      
      let viralRisk: 'low' | 'medium' | 'high' = 'low';
      if (reach > 100000 || engagement > 10000) {
        viralRisk = 'high';
      } else if (reach > 10000 || engagement > 1000) {
        viralRisk = 'medium';
      }

      return {
        id: post.id,
        source: post.author_name || post.author_username || 'Unknown',
        platform: post.platform,
        content: (post.content || post.title || '').substring(0, 150) + '...',
        timestamp: timeAgo,
        viralRisk,
        sentiment: post.sentiment || 'neutral',
        riskScore: post.risk_score || 0,
        postUrl: post.post_url,
      };
    });

    res.json({
      success: true,
      data: formattedPosts,
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error fetching recent posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent posts',
      message: error.message,
    });
  }
});

// GET /api/dashboard/risk-distribution - Risk score distribution histogram
router.get('/risk-distribution', async (req: Request, res: Response) => {
  try {
    const { configuration_id } = req.query;

    let query = supabase
      .from('posts')
      .select('risk_score');

    if (configuration_id) {
      query = query.eq('configuration_id', configuration_id as string);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      return res.json({
        success: true,
        data: {
          distribution: [
            { range: '0-2', label: 'Low', count: 0, percentage: 0, color: '#10B981' },
            { range: '3-4', label: 'Medium', count: 0, percentage: 0, color: '#F59E0B' },
            { range: '5-6', label: 'High', count: 0, percentage: 0, color: '#F97316' },
            { range: '7-8', label: 'Very High', count: 0, percentage: 0, color: '#EF4444' },
            { range: '9-10', label: 'Critical', count: 0, percentage: 0, color: '#DC2626' },
          ],
          total: 0,
          averageRisk: 0,
        },
      });
    }

    // Count posts in each risk range
    const ranges = {
      '0-2': { count: 0, label: 'Low', color: '#10B981' },
      '3-4': { count: 0, label: 'Medium', color: '#F59E0B' },
      '5-6': { count: 0, label: 'High', color: '#F97316' },
      '7-8': { count: 0, label: 'Very High', color: '#EF4444' },
      '9-10': { count: 0, label: 'Critical', color: '#DC2626' },
    };

    let totalWithRisk = 0;
    let riskSum = 0;

    posts.forEach(post => {
      const riskScore = post.risk_score;
      if (riskScore !== null && riskScore !== undefined) {
        totalWithRisk++;
        riskSum += riskScore;

        if (riskScore >= 0 && riskScore <= 2) {
          ranges['0-2'].count++;
        } else if (riskScore >= 3 && riskScore <= 4) {
          ranges['3-4'].count++;
        } else if (riskScore >= 5 && riskScore <= 6) {
          ranges['5-6'].count++;
        } else if (riskScore >= 7 && riskScore <= 8) {
          ranges['7-8'].count++;
        } else if (riskScore >= 9 && riskScore <= 10) {
          ranges['9-10'].count++;
        }
      }
    });

    // Calculate percentages and format response
    const distribution = Object.entries(ranges).map(([range, data]) => ({
      range,
      label: data.label,
      count: data.count,
      percentage: totalWithRisk > 0 ? Math.round((data.count / totalWithRisk) * 100) : 0,
      color: data.color,
    }));

    const averageRisk = totalWithRisk > 0 ? Math.round((riskSum / totalWithRisk) * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        distribution,
        total: totalWithRisk,
        averageRisk,
      },
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error fetching risk distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch risk distribution',
      message: error.message,
    });
  }
});

// GET /api/dashboard/ingestion-volume - New mentions over time
router.get('/ingestion-volume', async (req: Request, res: Response) => {
  try {
    const { range = '7d', configuration_id } = req.query;

    const now = new Date();
    let days: number;
    switch (range) {
      case '30d':
        days = 30;
        break;
      case 'quarter':
        days = 90;
        break;
      case '7d':
      default:
        days = 7;
    }

    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    let query = supabase
      .from('posts')
      .select('platform, created_at, fetched_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (configuration_id) {
      query = query.eq('configuration_id', configuration_id as string);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Group by day and count posts + per-platform volume
    const buckets: Record<string, {
      date: string;
      total: number;
      twitter: number;
      reddit: number;
      facebook: number;
      news: number;
    }> = {};

    posts.forEach((post: any) => {
      const ts = post.fetched_at || post.created_at;
      const d = new Date(ts);
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!buckets[key]) {
        buckets[key] = { date: key, total: 0, twitter: 0, reddit: 0, facebook: 0, news: 0 };
      }

      buckets[key].total += 1;
      if (post.platform === 'twitter') buckets[key].twitter += 1;
      if (post.platform === 'reddit') buckets[key].reddit += 1;
      if (post.platform === 'facebook') buckets[key].facebook += 1;
      if (post.platform === 'news') buckets[key].news += 1;
    });

    const result = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error fetching ingestion volume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ingestion volume',
      message: error.message,
    });
  }
});

export default router;



