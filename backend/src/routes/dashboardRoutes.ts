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
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Last 12 months (1 year)
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

    // --- Helpers (UTC-based to keep labels + bucketing stable) ---
    const isoDate = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD
    const parseISODate = (s: string) => new Date(`${s}T00:00:00Z`);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const addUTCDays = (d: Date, days: number) => {
      const dt = new Date(d);
      dt.setUTCDate(dt.getUTCDate() + days);
      return dt;
    };
    const startOfUTCWeekMonday = (d: Date) => {
      const dt = new Date(d);
      dt.setUTCHours(0, 0, 0, 0);
      const day = dt.getUTCDay(); // 0..6 (Sun..Sat)
      const diff = day === 0 ? -6 : 1 - day; // Monday-based week
      dt.setUTCDate(dt.getUTCDate() + diff);
      return dt;
    };
    const startOfUTCMonth = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const addUTCMonths = (d: Date, months: number) => {
      const dt = new Date(d);
      dt.setUTCHours(0, 0, 0, 0);
      dt.setUTCDate(1);
      dt.setUTCMonth(dt.getUTCMonth() + months);
      return dt;
    };

    // Group raw posts by day (UTC)
    const byDay: Record<string, { positive: number; neutral: number; negative: number }> = {};
    (posts as any[]).forEach((post) => {
      const key = isoDate(new Date(post.created_at));
      if (!byDay[key]) byDay[key] = { positive: 0, neutral: 0, negative: 0 };

      const sentiment = post.sentiment || 'neutral';
      if (sentiment === 'positive') byDay[key].positive++;
      else if (sentiment === 'negative') byDay[key].negative++;
      else byDay[key].neutral++;
    });

    type TrendPoint = { name: string; date: string; positive: number; neutral: number; negative: number };
    const result: TrendPoint[] = [];

    const todayUTC = new Date(now);
    todayUTC.setUTCHours(0, 0, 0, 0);

    if (range === '7d') {
      // Day-wise, last 7 days, labeled by weekday (Mon..Sun) in correct order
      for (let i = 6; i >= 0; i--) {
        const d = addUTCDays(todayUTC, -i);
        const key = isoDate(d);
        const counts = byDay[key] || { positive: 0, neutral: 0, negative: 0 };
        result.push({
          name: dayNames[d.getUTCDay()],
          date: key,
          ...counts,
        });
      }
    } else if (range === '30d') {
      // Day-wise, last 30 days, labeled by date (e.g., "Feb 11")
      for (let i = 29; i >= 0; i--) {
        const d = addUTCDays(todayUTC, -i);
        const key = isoDate(d);
        const counts = byDay[key] || { positive: 0, neutral: 0, negative: 0 };
        result.push({
          name: `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`,
          date: key,
          ...counts,
        });
      }
    } else if (range === 'quarter') {
      // Quarter-wise for quarter (divide 90 days into Q1, Q2, Q3, Q4)
      const start = startDate ? new Date(startDate) : addUTCDays(todayUTC, -89);
      start.setUTCHours(0, 0, 0, 0);
      
      // Divide 90 days into 4 quarters (~22-23 days each)
      const quarterDays = 22.5; // Average days per quarter
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      
      for (let q = 0; q < 4; q++) {
        const quarterStart = addUTCDays(start, Math.round(q * quarterDays));
        const quarterEnd = addUTCDays(start, Math.round((q + 1) * quarterDays) - 1);
        const quarterEndDate = quarterEnd > todayUTC ? todayUTC : quarterEnd;
        
        let quarterCounts = { positive: 0, neutral: 0, negative: 0 };
        
        for (let d = new Date(quarterStart); d <= quarterEndDate; d = addUTCDays(d, 1)) {
          const key = isoDate(d);
          const c = byDay[key];
          if (c) {
            quarterCounts.positive += c.positive;
            quarterCounts.neutral += c.neutral;
            quarterCounts.negative += c.negative;
          }
        }
        
        result.push({
          name: quarters[q],
          date: isoDate(quarterStart),
          ...quarterCounts,
        });
      }
    } else {
      // Total = month-wise buckets (label "Feb 2026")
      const dayKeys = Object.keys(byDay).sort();
      if (dayKeys.length > 0) {
        const first = startOfUTCMonth(parseISODate(dayKeys[0]));
        const last = startOfUTCMonth(parseISODate(dayKeys[dayKeys.length - 1]));
        let cursor = first;

        while (cursor <= last) {
          const next = addUTCMonths(cursor, 1);
          let monthCounts = { positive: 0, neutral: 0, negative: 0 };

          for (let d = new Date(cursor); d < next; d = addUTCDays(d, 1)) {
            const key = isoDate(d);
            const c = byDay[key];
            if (c) {
              monthCounts.positive += c.positive;
              monthCounts.neutral += c.neutral;
              monthCounts.negative += c.negative;
            }
          }

          const monthKey = isoDate(cursor); // YYYY-MM-01
          result.push({
            name: `${monthNames[cursor.getUTCMonth()]} ${cursor.getUTCFullYear()}`,
            date: monthKey,
            ...monthCounts,
          });

          cursor = next;
        }
      }
    }

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

// GET /api/dashboard/source-channels - Platform distribution
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

    // Count by platform
    const platformCounts: Record<string, number> = {};
    posts.forEach(post => {
      platformCounts[post.platform] = (platformCounts[post.platform] || 0) + 1;
    });

    // Map platforms to channels
    const socialMediaCount = (platformCounts.twitter || 0) + (platformCounts.facebook || 0) + (platformCounts.reddit || 0);
    const newsCount = platformCounts.news || 0;
    const forumsCount = platformCounts.reddit || 0; // Reddit can be both social and forum
    const internalCommsCount = 0; // Placeholder - can be added later

    const channels = [
      {
        label: 'Social Media',
        value: Math.round((socialMediaCount / total) * 100),
        count: socialMediaCount,
        platforms: ['twitter', 'facebook', 'reddit'],
      },
      {
        label: 'News Outlets',
        value: Math.round((newsCount / total) * 100),
        count: newsCount,
        platforms: ['news'],
      },
      {
        label: 'Forums & Blogs',
        value: Math.round((forumsCount / total) * 100),
        count: forumsCount,
        platforms: ['reddit'],
      },
      {
        label: 'Internal Comms',
        value: Math.round((internalCommsCount / total) * 100),
        count: internalCommsCount,
        platforms: [],
      },
    ].filter(channel => channel.count > 0); // Remove zero channels

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

    const isoDate = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setUTCHours(0, 0, 0, 0);

    let result: Array<{ date: string; total: number; twitter: number; reddit: number; facebook: number; news: number }> = [];

    if (range === 'quarter') {
      // Quarter-wise for quarter (divide 90 days into Q1, Q2, Q3, Q4)
      const quarterDays = 22.5; // Average days per quarter
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      
      // Group posts by day first
      const byDay: Record<string, { total: number; twitter: number; reddit: number; facebook: number; news: number }> = {};
      
      (posts || []).forEach((post: any) => {
        const ts = post.fetched_at || post.created_at;
        const key = isoDate(new Date(ts));
        if (!byDay[key]) {
          byDay[key] = { total: 0, twitter: 0, reddit: 0, facebook: 0, news: 0 };
        }
        
        byDay[key].total += 1;
        if (post.platform === 'twitter') byDay[key].twitter += 1;
        if (post.platform === 'reddit') byDay[key].reddit += 1;
        if (post.platform === 'facebook') byDay[key].facebook += 1;
        if (post.platform === 'news') byDay[key].news += 1;
      });
      
      // Aggregate by quarters
      for (let q = 0; q < 4; q++) {
        const quarterStart = new Date(start);
        quarterStart.setUTCDate(quarterStart.getUTCDate() + Math.round(q * quarterDays));
        const quarterEnd = new Date(start);
        quarterEnd.setUTCDate(quarterEnd.getUTCDate() + Math.round((q + 1) * quarterDays) - 1);
        const quarterEndDate = quarterEnd > end ? end : quarterEnd;
        
        const quarterData = { date: quarters[q], total: 0, twitter: 0, reddit: 0, facebook: 0, news: 0 };
        
        for (let d = new Date(quarterStart); d <= quarterEndDate; d.setUTCDate(d.getUTCDate() + 1)) {
          const key = isoDate(d);
          const dayData = byDay[key];
          if (dayData) {
            quarterData.total += dayData.total;
            quarterData.twitter += dayData.twitter;
            quarterData.reddit += dayData.reddit;
            quarterData.facebook += dayData.facebook;
            quarterData.news += dayData.news;
          }
        }
        
        result.push(quarterData);
      }
    } else {
      // Daily buckets for 7d and 30d
      const buckets: Record<
        string,
        { date: string; total: number; twitter: number; reddit: number; facebook: number; news: number }
      > = {};

      // Initialize buckets
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const key = isoDate(d);
        buckets[key] = { date: key, total: 0, twitter: 0, reddit: 0, facebook: 0, news: 0 };
      }

      (posts || []).forEach((post: any) => {
        const ts = post.fetched_at || post.created_at;
        const key = isoDate(new Date(ts));
        if (!buckets[key]) {
          buckets[key] = { date: key, total: 0, twitter: 0, reddit: 0, facebook: 0, news: 0 };
        }

        buckets[key].total += 1;
        if (post.platform === 'twitter') buckets[key].twitter += 1;
        if (post.platform === 'reddit') buckets[key].reddit += 1;
        if (post.platform === 'facebook') buckets[key].facebook += 1;
        if (post.platform === 'news') buckets[key].news += 1;
      });

      result = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
    }

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



