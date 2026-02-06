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
 * GET /api/narratives
 * Get all narratives with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { configuration_id, status, type, sort_by = 'last_updated_at', order = 'desc' } = req.query;

    let query = supabase
      .from('narratives')
      .select(`
        *,
        narrative_posts(count)
      `);

    if (configuration_id) {
      query = query.eq('configuration_id', configuration_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Sorting
    const validSortFields = ['last_updated_at', 'strength_score', 'post_count', 'first_emergence_at'];
    const sortByStr = typeof sort_by === 'string' ? sort_by : 'last_updated_at';
    const sortField: string = validSortFields.includes(sortByStr) ? sortByStr : 'last_updated_at';
    query = query.order(sortField, { ascending: order === 'asc' });

    const { data: narratives, error } = await query;

    if (error) {
      throw error;
    }

    // Transform data to match frontend format
    const transformedNarratives = narratives?.map(narrative => ({
      id: narrative.id,
      title: narrative.title,
      type: narrative.type,
      status: narrative.status,
      summary: narrative.summary || '',
      strengthScore: narrative.strength_score || 0,
      riskLevel: narrative.risk_level || 'low',
      intentSignal: 'organic' as const, // Default, can be enhanced
      volumeOfMentions: narrative.post_count || 0,
      persistenceDays: narrative.persistence_days || 0,
      amplificationVelocity: narrative.amplification_velocity || 0,
      affectedEntities: narrative.aggregated_topics || [],
      platforms: {
        news: narrative.platform_distribution?.news || 0,
        social: (narrative.platform_distribution?.twitter || 0) + (narrative.platform_distribution?.reddit || 0) + (narrative.platform_distribution?.facebook || 0),
        forums: narrative.platform_distribution?.reddit || 0,
      },
      platformDetails: {
        twitter: narrative.platform_distribution?.twitter || 0,
        reddit: narrative.platform_distribution?.reddit || 0,
        facebook: narrative.platform_distribution?.facebook || 0,
        news: narrative.platform_distribution?.news || 0,
      },
      contributingTopics: narrative.contributing_topics_count || 0,
      reinforcingPosts: narrative.post_count || 0,
      influencerInvolvement: false, // Default, can be enhanced
      firstEmergence: narrative.first_emergence_at ? formatRelativeTime(narrative.first_emergence_at) : 'Unknown',
      lastUpdated: narrative.last_updated_at ? formatRelativeTime(narrative.last_updated_at) : 'Unknown',
      confidence: 85, // Default, can be calculated
      trendData: narrative.trend_data || [],
      keyFrames: narrative.key_frames || [],
      geographicSpread: [], // Can be enhanced
    })) || [];

    res.json({
      success: true,
      data: transformedNarratives,
      count: transformedNarratives.length,
    });
  } catch (error: any) {
    console.error('Error fetching narratives:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch narratives',
    });
  }
});

/**
 * GET /api/narratives/:id
 * Get narrative by ID with posts
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: narrative, error: narrativeError } = await supabase
      .from('narratives')
      .select('*')
      .eq('id', id)
      .single();

    if (narrativeError || !narrative) {
      return res.status(404).json({
        success: false,
        error: 'Narrative not found',
      });
    }

    // Get posts in this narrative
    const { data: postMappings, error: mappingError } = await supabase
      .from('narrative_posts')
      .select('post_id, matched_by, matched_value, created_at')
      .eq('narrative_id', id)
      .order('created_at', { ascending: false });

    const postIds = postMappings?.map(m => m.post_id) || [];

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });

    const transformedNarrative = {
      id: narrative.id,
      title: narrative.title,
      type: narrative.type,
      status: narrative.status,
      summary: narrative.summary || '',
      strengthScore: narrative.strength_score || 0,
      riskLevel: narrative.risk_level || 'low',
      intentSignal: 'organic' as const,
      volumeOfMentions: narrative.post_count || 0,
      persistenceDays: narrative.persistence_days || 0,
      amplificationVelocity: narrative.amplification_velocity || 0,
      affectedEntities: narrative.aggregated_topics || [],
      platforms: {
        news: narrative.platform_distribution?.news || 0,
        social: (narrative.platform_distribution?.twitter || 0) + (narrative.platform_distribution?.reddit || 0) + (narrative.platform_distribution?.facebook || 0),
        forums: narrative.platform_distribution?.reddit || 0,
      },
      platformDetails: {
        twitter: narrative.platform_distribution?.twitter || 0,
        reddit: narrative.platform_distribution?.reddit || 0,
        facebook: narrative.platform_distribution?.facebook || 0,
        news: narrative.platform_distribution?.news || 0,
      },
      contributingTopics: narrative.contributing_topics_count || 0,
      reinforcingPosts: narrative.post_count || 0,
      influencerInvolvement: false,
      firstEmergence: narrative.first_emergence_at ? formatRelativeTime(narrative.first_emergence_at) : 'Unknown',
      lastUpdated: narrative.last_updated_at ? formatRelativeTime(narrative.last_updated_at) : 'Unknown',
      confidence: 85,
      trendData: narrative.trend_data || [],
      keyFrames: narrative.key_frames || [],
      geographicSpread: [],
      posts: posts || [],
    };

    res.json({
      success: true,
      data: transformedNarrative,
    });
  } catch (error: any) {
    console.error('Error fetching narrative:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch narrative',
    });
  }
});

/**
 * GET /api/narratives/:id/posts
 * Get all posts for a narrative
 */
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: postMappings, error: mappingError } = await supabase
      .from('narrative_posts')
      .select('post_id')
      .eq('narrative_id', id)
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
    console.error('Error fetching narrative posts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch narrative posts',
    });
  }
});

export default router;

