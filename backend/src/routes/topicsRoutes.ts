import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

/**
 * GET /api/topics
 * Get all topics with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { configuration_id, status, sort_by = 'last_updated_at', order = 'desc' } = req.query;

    let query = supabase
      .from('topics')
      .select(`
        *,
        topic_posts(count)
      `);

    if (configuration_id) {
      query = query.eq('configuration_id', configuration_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Sorting
    const validSortFields = ['last_updated_at', 'average_risk_score', 'post_count', 'first_detected_at'];
    const sortByStr = typeof sort_by === 'string' ? sort_by : 'last_updated_at';
    const sortField: string = validSortFields.includes(sortByStr) ? sortByStr : 'last_updated_at';
    query = query.order(sortField, { ascending: order === 'asc' });

    const { data: topics, error } = await query;

    if (error) {
      throw error;
    }

    // Transform data to match frontend format
    const transformedTopics = topics?.map(topic => ({
      id: topic.id,
      name: topic.name,
      status: topic.status,
      summary: topic.description || '',
      mentions: topic.post_count || 0,
      riskScore: parseFloat(topic.average_risk_score || '0'),
      sentiment: topic.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 },
      velocity: topic.velocity || 'stable',
      platforms: {
        news: topic.platform_distribution?.news || 0,
        social: (topic.platform_distribution?.twitter || 0) + (topic.platform_distribution?.reddit || 0) + (topic.platform_distribution?.facebook || 0),
        forums: topic.platform_distribution?.reddit || 0,
      },
      entities: topic.aggregated_topics || [],
      firstDetected: topic.first_detected_at ? formatRelativeTime(topic.first_detected_at) : 'Unknown',
      lastUpdated: topic.last_updated_at ? formatRelativeTime(topic.last_updated_at) : 'Unknown',
      narratives: [], // Will be populated if needed
      trendData: topic.trend_data || [],
    })) || [];

    res.json({
      success: true,
      data: transformedTopics,
      count: transformedTopics.length,
    });
  } catch (error: any) {
    console.error('Error fetching topics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch topics',
    });
  }
});

/**
 * GET /api/topics/:id
 * Get topic by ID with posts
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single();

    if (topicError || !topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found',
      });
    }

    // Get posts in this topic
    const { data: postMappings, error: mappingError } = await supabase
      .from('topic_posts')
      .select('post_id, matched_by, matched_value, created_at')
      .eq('topic_id', id)
      .order('created_at', { ascending: false });

    const postIds = postMappings?.map(m => m.post_id) || [];

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });

    const transformedTopic = {
      id: topic.id,
      name: topic.name,
      status: topic.status,
      summary: topic.description || '',
      mentions: topic.post_count || 0,
      riskScore: parseFloat(topic.average_risk_score || '0'),
      sentiment: topic.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 },
      velocity: topic.velocity || 'stable',
      platforms: {
        news: topic.platform_distribution?.news || 0,
        social: (topic.platform_distribution?.twitter || 0) + (topic.platform_distribution?.reddit || 0) + (topic.platform_distribution?.facebook || 0),
        forums: topic.platform_distribution?.reddit || 0,
      },
      entities: topic.aggregated_topics || [],
      firstDetected: topic.first_detected_at ? formatRelativeTime(topic.first_detected_at) : 'Unknown',
      lastUpdated: topic.last_updated_at ? formatRelativeTime(topic.last_updated_at) : 'Unknown',
      narratives: [],
      trendData: topic.trend_data || [],
      posts: posts || [],
    };

    res.json({
      success: true,
      data: transformedTopic,
    });
  } catch (error: any) {
    console.error('Error fetching topic:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch topic',
    });
  }
});

/**
 * GET /api/topics/:id/posts
 * Get all posts for a topic
 */
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: postMappings, error: mappingError } = await supabase
      .from('topic_posts')
      .select('post_id')
      .eq('topic_id', id)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (mappingError) {
      throw mappingError;
    }

    const postIds = postMappings?.map(m => m.post_id) || [];

    if (postIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (postsError) {
      throw postsError;
    }

    res.json({
      success: true,
      data: posts || [],
      count: posts?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching topic posts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch topic posts',
    });
  }
});

export default router;

