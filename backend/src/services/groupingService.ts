import { supabase } from '../config/supabase.js';
import OpenAI from 'openai';

interface PostWithAnalysis {
  id: string;
  topics: string[];
  keywords: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  risk_score?: number;
  platform: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  configuration_id: string;
}

interface GroupMatch {
  groupId: string;
  groupType: 'topic' | 'narrative';
  matchedBy: 'topic' | 'keyword';
  matchedValue: string;
  confidence: number;
}

export class GroupingService {
  private openai: OpenAI | null = null;

  constructor(openaiApiKey?: string) {
    if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
    }
  }

  /**
   * Normalize text for comparison (lowercase, trim, remove special chars)
   */
  private normalizeTerm(term: string): string {
    return term.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }

  /**
   * Check if two terms are exactly the same (after normalization)
   */
  private isExactMatch(term1: string, term2: string): boolean {
    return this.normalizeTerm(term1) === this.normalizeTerm(term2);
  }

  /**
   * Check if two terms are similar (fuzzy matching)
   */
  private isSimilarTerm(term1: string, term2: string): boolean {
    const norm1 = this.normalizeTerm(term1);
    const norm2 = this.normalizeTerm(term2);
    
    // Exact match
    if (norm1 === norm2) return true;
    
    // One contains the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      const shorter = norm1.length < norm2.length ? norm1 : norm2;
      const longer = norm1.length >= norm2.length ? norm1 : norm2;
      // If shorter is at least 60% of longer, consider similar
      return shorter.length / longer.length >= 0.6;
    }
    
    // Check semantic similarity from database
    return false; // Will be enhanced with semantic lookup
  }

  /**
   * Get semantic similarity from database
   */
  private async getSemanticSimilarity(term1: string, term2: string): Promise<boolean> {
    const norm1 = this.normalizeTerm(term1);
    const norm2 = this.normalizeTerm(term2);
    
    const { data } = await supabase
      .from('semantic_similarity')
      .select('*')
      .or(`and(term1.eq.${norm1},term2.eq.${norm2}),and(term1.eq.${norm2},term2.eq.${norm1})`)
      .limit(1);
    
    if (!data || data.length === 0) return false;
    
    return true;
  }

  /**
   * Check if post matches a group by topics/keywords
   */
  private async checkGroupMatch(
    post: PostWithAnalysis,
    groupTopics: string[],
    groupKeywords: string[]
  ): Promise<{ matched: boolean; matchedBy?: 'topic' | 'keyword'; matchedValue?: string }> {
    // Check exact matches first
    for (const postTopic of post.topics) {
      for (const groupTopic of groupTopics) {
        if (this.isExactMatch(postTopic, groupTopic)) {
          return { matched: true, matchedBy: 'topic', matchedValue: postTopic };
        }
      }
      for (const groupKeyword of groupKeywords) {
        if (this.isExactMatch(postTopic, groupKeyword)) {
          return { matched: true, matchedBy: 'keyword', matchedValue: postTopic };
        }
      }
    }

    for (const postKeyword of post.keywords) {
      for (const groupTopic of groupTopics) {
        if (this.isExactMatch(postKeyword, groupTopic)) {
          return { matched: true, matchedBy: 'topic', matchedValue: postKeyword };
        }
      }
      for (const groupKeyword of groupKeywords) {
        if (this.isExactMatch(postKeyword, groupKeyword)) {
          return { matched: true, matchedBy: 'keyword', matchedValue: postKeyword };
        }
      }
    }

    // Check fuzzy matches
    for (const postTopic of post.topics) {
      for (const groupTopic of groupTopics) {
        if (this.isSimilarTerm(postTopic, groupTopic)) {
          return { matched: true, matchedBy: 'topic', matchedValue: postTopic };
        }
      }
      for (const groupKeyword of groupKeywords) {
        if (this.isSimilarTerm(postTopic, groupKeyword)) {
          return { matched: true, matchedBy: 'keyword', matchedValue: postTopic };
        }
      }
    }

    for (const postKeyword of post.keywords) {
      for (const groupTopic of groupTopics) {
        if (this.isSimilarTerm(postKeyword, groupTopic)) {
          return { matched: true, matchedBy: 'topic', matchedValue: postKeyword };
        }
      }
      for (const groupKeyword of groupKeywords) {
        if (this.isSimilarTerm(postKeyword, groupKeyword)) {
          return { matched: true, matchedBy: 'keyword', matchedValue: postKeyword };
        }
      }
    }

    // Check semantic similarity
    for (const postTopic of post.topics) {
      for (const groupTopic of groupTopics) {
        if (await this.getSemanticSimilarity(postTopic, groupTopic)) {
          return { matched: true, matchedBy: 'topic', matchedValue: postTopic };
        }
      }
    }

    for (const postKeyword of post.keywords) {
      for (const groupKeyword of groupKeywords) {
        if (await this.getSemanticSimilarity(postKeyword, groupKeyword)) {
          return { matched: true, matchedBy: 'keyword', matchedValue: postKeyword };
        }
      }
    }

    return { matched: false };
  }

  /**
   * Find matching groups for a post
   */
  async findMatchingGroups(
    post: PostWithAnalysis,
    groupType: 'topic' | 'narrative' = 'topic'
  ): Promise<GroupMatch[]> {
    const tableName = groupType === 'topic' ? 'topics' : 'narratives';
    // Check all groups regardless of status - we want to merge into existing groups
    const { data: groups, error } = await supabase
      .from(tableName)
      .select('id, aggregated_topics, aggregated_keywords')
      .eq('configuration_id', post.configuration_id);

    if (error || !groups) {
      console.error(`Error fetching ${groupType}s:`, error);
      return [];
    }

    const matches: GroupMatch[] = [];

    for (const group of groups) {
      const groupTopics = (group.aggregated_topics as string[]) || [];
      const groupKeywords = (group.aggregated_keywords as string[]) || [];

      const match = await this.checkGroupMatch(post, groupTopics, groupKeywords);
      if (match.matched && match.matchedBy && match.matchedValue) {
        matches.push({
          groupId: group.id,
          groupType,
          matchedBy: match.matchedBy,
          matchedValue: match.matchedValue,
          confidence: 1.0,
        });
      }
    }

    return matches;
  }

  /**
   * Create a new group from a post
   */
  async createGroupFromPost(
    post: PostWithAnalysis,
    groupType: 'topic' | 'narrative' = 'topic'
  ): Promise<string> {
    const tableName = groupType === 'topic' ? 'topics' : 'narratives';
    const mappingTable = groupType === 'topic' ? 'topic_posts' : 'narrative_posts';
    const idField = groupType === 'topic' ? 'topic_id' : 'narrative_id';

    // Generate group name from most common topic/keyword
    const allTerms = [...post.topics, ...post.keywords];
    const groupName = allTerms[0] || `New ${groupType}`;
    const groupDescription = groupType === 'narrative' 
      ? `Narrative emerging from posts about ${allTerms.slice(0, 3).join(', ')}`
      : `Topic group for ${allTerms.slice(0, 3).join(', ')}`;

    const groupData: any = {
      aggregated_topics: post.topics,
      aggregated_keywords: post.keywords,
      post_count: 1,
      average_risk_score: post.risk_score || 0,
      sentiment_distribution: {
        positive: post.sentiment === 'positive' ? 1 : 0,
        neutral: post.sentiment === 'neutral' ? 1 : 0,
        negative: post.sentiment === 'negative' ? 1 : 0,
      },
      platform_distribution: {
        twitter: post.platform === 'twitter' ? 1 : 0,
        reddit: post.platform === 'reddit' ? 1 : 0,
        facebook: post.platform === 'facebook' ? 1 : 0,
        news: post.platform === 'news' ? 1 : 0,
      },
      total_engagement: post.likes_count + post.comments_count + post.shares_count,
      configuration_id: post.configuration_id,
    };

    if (groupType === 'topic') {
      groupData.name = groupName;
      groupData.description = groupDescription;
    } else {
      groupData.title = groupName;
      groupData.summary = groupDescription;
    }

    if (groupType === 'narrative') {
      groupData.strength_score = Math.min(100, (post.risk_score || 0) * 10);
      groupData.risk_level = this.calculateRiskLevel(post.risk_score || 0);
      groupData.persistence_days = 0;
      groupData.amplification_velocity = 0;
    }

    const { data: newGroup, error: groupError } = await supabase
      .from(tableName)
      .insert(groupData)
      .select('id')
      .single();

    if (groupError || !newGroup) {
      console.error(`Error creating ${groupType}:`, groupError);
      throw new Error(`Failed to create ${groupType}`);
    }

    // Link post to group
    await supabase.from(mappingTable).insert({
      [idField]: newGroup.id,
      post_id: post.id,
      matched_by: 'topic',
      matched_value: post.topics[0] || post.keywords[0] || '',
    });

    return newGroup.id;
  }

  /**
   * Add post to existing group
   */
  async addPostToGroup(
    post: PostWithAnalysis,
    groupId: string,
    groupType: 'topic' | 'narrative',
    matchedBy: 'topic' | 'keyword',
    matchedValue: string
  ): Promise<void> {
    const tableName = groupType === 'topic' ? 'topics' : 'narratives';
    const mappingTable = groupType === 'topic' ? 'topic_posts' : 'narrative_posts';
    const idField = groupType === 'topic' ? 'topic_id' : 'narrative_id';

    // Check if post is already in this group
    const { data: existing, error: checkError } = await supabase
      .from(mappingTable)
      .select('*')
      .eq(idField, groupId)
      .eq('post_id', post.id)
      .limit(1);

    if (checkError) {
      console.error(`Error checking existing mapping:`, checkError);
      return;
    }

    // Skip if already in group
    if (existing && existing.length > 0) {
      console.log(`[GroupingService] Post ${post.id} already in ${groupType} ${groupId}`);
      // Still update analytics in case post data changed
      await this.updateGroupAnalytics(groupId, groupType);
      return;
    }

    // Link post to group
    const { error: insertError } = await supabase.from(mappingTable).insert({
      [idField]: groupId,
      post_id: post.id,
      matched_by: matchedBy,
      matched_value: matchedValue,
    });

    if (insertError) {
      console.error(`Error adding post to ${groupType}:`, insertError);
      return;
    }

    console.log(`[GroupingService] ✅ Merged post ${post.id} into ${groupType} ${groupId} (matched by ${matchedBy}: ${matchedValue})`);

    // Update group analytics
    await this.updateGroupAnalytics(groupId, groupType);
  }

  /**
   * Update group analytics from all posts in the group
   */
  async updateGroupAnalytics(groupId: string, groupType: 'topic' | 'narrative'): Promise<void> {
    const tableName = groupType === 'topic' ? 'topics' : 'narratives';
    const mappingTable = groupType === 'topic' ? 'topic_posts' : 'narrative_posts';
    const idField = groupType === 'topic' ? 'topic_id' : 'narrative_id';

    // Get all posts in this group
    const { data: mappings, error: mappingError } = await supabase
      .from(mappingTable)
      .select('post_id')
      .eq(idField, groupId);

    if (mappingError || !mappings || mappings.length === 0) return;

    const postIds = mappings.map(m => m.post_id);

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds);

    if (postsError || !posts) return;

    // Calculate analytics
    const postCount = posts.length;
    const riskScores = posts.map(p => p.risk_score).filter((r): r is number => r !== null && r !== undefined);
    const avgRiskScore = riskScores.length > 0
      ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
      : 0;

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const platformCounts: Record<string, number> = {};
    let totalEngagement = 0;
    const allTopics = new Set<string>();
    const allKeywords = new Set<string>();

    for (const post of posts) {
      if (post.sentiment) {
        sentimentCounts[post.sentiment as keyof typeof sentimentCounts]++;
      }
      platformCounts[post.platform] = (platformCounts[post.platform] || 0) + 1;
      totalEngagement += (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0);
      
      if (post.topics && Array.isArray(post.topics)) {
        post.topics.forEach((t: string) => allTopics.add(t));
      }
      if (post.keywords && Array.isArray(post.keywords)) {
        post.keywords.forEach((k: string) => allKeywords.add(k));
      }
    }

    const sentimentTotal = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
    const sentimentDistribution = {
      positive: sentimentTotal > 0 ? Math.round((sentimentCounts.positive / sentimentTotal) * 100) : 0,
      neutral: sentimentTotal > 0 ? Math.round((sentimentCounts.neutral / sentimentTotal) * 100) : 0,
      negative: sentimentTotal > 0 ? Math.round((sentimentCounts.negative / sentimentTotal) * 100) : 0,
    };

    const platformTotal = Object.values(platformCounts).reduce((a, b) => a + b, 0);
    const platformDistribution = {
      twitter: platformTotal > 0 ? Math.round(((platformCounts.twitter || 0) / platformTotal) * 100) : 0,
      reddit: platformTotal > 0 ? Math.round(((platformCounts.reddit || 0) / platformTotal) * 100) : 0,
      facebook: platformTotal > 0 ? Math.round(((platformCounts.facebook || 0) / platformTotal) * 100) : 0,
      news: platformTotal > 0 ? Math.round(((platformCounts.news || 0) / platformTotal) * 100) : 0,
    };

    const updateData: any = {
      post_count: postCount,
      average_risk_score: avgRiskScore,
      sentiment_distribution: sentimentDistribution,
      platform_distribution: platformDistribution,
      total_engagement: totalEngagement,
      aggregated_topics: Array.from(allTopics),
      aggregated_keywords: Array.from(allKeywords),
      last_updated_at: new Date().toISOString(),
    };

    if (groupType === 'narrative') {
      updateData.strength_score = Math.min(100, Math.round(avgRiskScore * 10));
      updateData.risk_level = this.calculateRiskLevel(avgRiskScore);
      updateData.persistence_days = this.calculatePersistenceDays(posts);
      updateData.contributing_topics_count = allTopics.size;
    }

    await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', groupId);
  }

  /**
   * Group a new post (called when post is stored)
   */
  async groupPost(postId: string, configurationId: string): Promise<void> {
    // Get post with analysis data
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      console.error('Error fetching post for grouping:', error);
      return;
    }

    const postWithAnalysis: PostWithAnalysis = {
      id: post.id,
      topics: (post.topics as string[]) || [],
      keywords: (post.keywords as string[]) || [],
      sentiment: post.sentiment as 'positive' | 'neutral' | 'negative' | undefined,
      risk_score: post.risk_score ? parseFloat(post.risk_score.toString()) : undefined,
      platform: post.platform,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      created_at: post.created_at,
      configuration_id: configurationId,
    };

    // Skip if post has no topics/keywords
    if (postWithAnalysis.topics.length === 0 && postWithAnalysis.keywords.length === 0) {
      return;
    }

    // Try to match with existing topics
    const topicMatches = await this.findMatchingGroups(postWithAnalysis, 'topic');
    if (topicMatches.length > 0) {
      // Add to first matching topic (best match)
      // In future, could add to multiple if they all match well
      await this.addPostToGroup(
        postWithAnalysis,
        topicMatches[0].groupId,
        'topic',
        topicMatches[0].matchedBy,
        topicMatches[0].matchedValue
      );
      console.log(`[GroupingService] Post ${postId} merged into topic ${topicMatches[0].groupId}`);
    } else {
      // Create new topic
      try {
        const newTopicId = await this.createGroupFromPost(postWithAnalysis, 'topic');
        console.log(`[GroupingService] Created new topic ${newTopicId} for post ${postId}`);
      } catch (error: any) {
        // If topic already exists (duplicate name), try to find and merge
        if (error.code === '23505') {
          console.log(`[GroupingService] Topic with same name exists, attempting to merge...`);
          // Re-fetch groups and try to merge
          const retryMatches = await this.findMatchingGroups(postWithAnalysis, 'topic');
          if (retryMatches.length > 0) {
            await this.addPostToGroup(
              postWithAnalysis,
              retryMatches[0].groupId,
              'topic',
              retryMatches[0].matchedBy,
              retryMatches[0].matchedValue
            );
          }
        } else {
          console.error(`[GroupingService] Error creating topic:`, error);
        }
      }
    }

    // Try to match with existing narratives
    const narrativeMatches = await this.findMatchingGroups(postWithAnalysis, 'narrative');
    if (narrativeMatches.length > 0) {
      // Add to first matching narrative (best match)
      await this.addPostToGroup(
        postWithAnalysis,
        narrativeMatches[0].groupId,
        'narrative',
        narrativeMatches[0].matchedBy,
        narrativeMatches[0].matchedValue
      );
      console.log(`[GroupingService] Post ${postId} merged into narrative ${narrativeMatches[0].groupId}`);
    } else {
      // Create new narrative
      try {
        const newNarrativeId = await this.createGroupFromPost(postWithAnalysis, 'narrative');
        console.log(`[GroupingService] Created new narrative ${newNarrativeId} for post ${postId}`);
      } catch (error: any) {
        // If narrative already exists (duplicate title), try to find and merge
        if (error.code === '23505') {
          console.log(`[GroupingService] Narrative with same title exists, attempting to merge...`);
          // Re-fetch groups and try to merge
          const retryMatches = await this.findMatchingGroups(postWithAnalysis, 'narrative');
          if (retryMatches.length > 0) {
            await this.addPostToGroup(
              postWithAnalysis,
              retryMatches[0].groupId,
              'narrative',
              retryMatches[0].matchedBy,
              retryMatches[0].matchedValue
            );
          }
        } else {
          console.error(`[GroupingService] Error creating narrative:`, error);
        }
      }
    }
  }

  /**
   * Calculate risk level from risk score
   */
  private calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore < 4) return 'low';
    if (riskScore < 6) return 'medium';
    if (riskScore < 7) return 'high';
    return 'critical';
  }

  /**
   * Calculate persistence days from posts
   */
  private calculatePersistenceDays(posts: any[]): number {
    if (posts.length === 0) return 0;
    const dates = posts.map(p => new Date(p.created_at).getTime());
    const oldest = Math.min(...dates);
    const newest = Math.max(...dates);
    return Math.floor((newest - oldest) / (1000 * 60 * 60 * 24));
  }
}

