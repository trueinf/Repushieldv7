import { supabase } from '../config/supabase';
import { TwitterPost } from './apiClients/twitterApi';
import { RedditPost } from './apiClients/redditApi';
import { FacebookPost } from './apiClients/facebookApi';
import { NewsArticle } from './apiClients/newsApi';

export interface StoredPost {
  platform: 'twitter' | 'reddit' | 'facebook' | 'news';
  post_id: string;
  content: string;
  title?: string;
  created_at: string;
  post_url: string;
  author_id?: string;
  author_username?: string;
  author_name?: string;
  author_verified?: boolean;
  author_followers?: number;
  author_following?: number;
  author_profile_image?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  retweets_count?: number;
  upvotes_count?: number;
  media_urls: string[];
  media_types: string[];
  thumbnail_url?: string;
  raw_data: any;
  configuration_id: string;
}

export class PostStorage {
  static async storeTwitterPost(
    post: TwitterPost,
    configurationId: string
  ): Promise<void> {
    const storedPost: StoredPost = {
      platform: 'twitter',
      post_id: post.id,
      content: post.text,
      created_at: new Date(post.created_at).toISOString(),
      post_url: `https://twitter.com/${post.author.username}/status/${post.id}`,
      author_id: post.author.id,
      author_username: post.author.username,
      author_name: post.author.name,
      author_verified: post.author.verified,
      author_followers: post.author.followers_count,
      author_following: post.author.following_count,
      author_profile_image: post.author.profile_image_url,
      likes_count: post.public_metrics.like_count,
      comments_count: post.public_metrics.reply_count,
      shares_count: post.public_metrics.retweet_count,
      retweets_count: post.public_metrics.retweet_count,
      media_urls: post.media?.map(m => m.url || m.preview_image_url || '').filter(Boolean) || [],
      media_types: post.media?.map(m => m.type) || [],
      thumbnail_url: post.media?.[0]?.preview_image_url,
      raw_data: post,
      configuration_id: configurationId,
    };

    await this.insertPost(storedPost);
  }

  static async storeRedditPost(
    post: RedditPost,
    configurationId: string
  ): Promise<void> {
    const mediaUrls: string[] = [];
    const mediaTypes: string[] = [];

    if (post.media?.url) {
      mediaUrls.push(post.media.url);
      mediaTypes.push(post.media.type);
    } else if (post.preview?.images?.[0]?.source?.url) {
      const imageUrl = post.preview.images[0].source.url.replace(/&amp;/g, '&');
      mediaUrls.push(imageUrl);
      mediaTypes.push('image');
    } else if (post.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) {
      mediaUrls.push(post.url);
      mediaTypes.push('image');
    }

    const storedPost: StoredPost = {
      platform: 'reddit',
      post_id: post.id,
      content: post.selftext,
      title: post.title,
      created_at: new Date(post.created_utc * 1000).toISOString(),
      post_url: `https://reddit.com${post.url.startsWith('/') ? '' : '/'}${post.url}`,
      // Use subreddit as author (primary path: data.posts[].data.subreddit)
      author_id: post.subreddit || post.author,
      author_username: post.subreddit || post.author,
      author_name: post.subreddit_prefixed || post.subreddit || post.author,
      likes_count: post.score,
      comments_count: post.num_comments,
      shares_count: 0,
      upvotes_count: post.score,
      media_urls: mediaUrls,
      media_types: mediaTypes,
      thumbnail_url: post.thumbnail !== 'self' ? post.thumbnail : undefined,
      raw_data: post,
      configuration_id: configurationId,
    };

    await this.insertPost(storedPost);
  }

  static async storeFacebookPost(
    post: FacebookPost,
    configurationId: string
  ): Promise<void> {
    const mediaUrls: string[] = [];
    const mediaTypes: string[] = [];

    if (post.full_picture) {
      mediaUrls.push(post.full_picture);
      mediaTypes.push('image');
    }

    if (post.attachments?.data) {
      post.attachments.data.forEach(attachment => {
        if (attachment.media?.image?.src) {
          mediaUrls.push(attachment.media.image.src);
          mediaTypes.push('image');
        }
        if (attachment.media?.source) {
          mediaUrls.push(attachment.media.source);
          mediaTypes.push('video');
        }
      });
    }

    const storedPost: StoredPost = {
      platform: 'facebook',
      post_id: post.id,
      content: post.message,
      created_at: new Date(post.created_time).toISOString(),
      post_url: `https://facebook.com/${post.id}`,
      // Primary path: results[].from.name, fallback: results[].author.name or results[].user.name
      author_id: post.from.id,
      author_username: post.from.username || post.from.name,
      author_name: post.from.name,
      author_followers: post.from.followers,
      likes_count: post.likes?.summary?.total_count || 0,
      comments_count: post.comments?.summary?.total_count || 0,
      shares_count: post.shares?.count || 0,
      media_urls: mediaUrls,
      media_types: mediaTypes,
      thumbnail_url: post.full_picture,
      raw_data: post,
      configuration_id: configurationId,
    };

    await this.insertPost(storedPost);
  }

  static async storeNewsArticle(
    article: NewsArticle,
    configurationId: string
  ): Promise<void> {
    try {
      const storedPost: StoredPost = {
        platform: 'news',
        post_id: article.link,
        content: article.snippet,
        title: article.title,
        created_at: article.date_parsed || new Date(article.date).toISOString(),
        post_url: article.link,
        author_name: article.source,
        media_urls: article.thumbnail ? [article.thumbnail] : [],
        media_types: article.thumbnail ? ['image'] : [],
        thumbnail_url: article.thumbnail,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        raw_data: article,
        configuration_id: configurationId,
      };

      await this.insertPost(storedPost);
    } catch (error: any) {
      console.error('Error in storeNewsArticle:', error);
      throw error;
    }
  }

  private static async insertPost(post: StoredPost): Promise<void> {
    try {
      // Ensure post_id is not empty
      if (!post.post_id || post.post_id.trim() === '') {
        throw new Error('Post ID cannot be empty');
      }

      // Ensure configuration_id is present
      if (!post.configuration_id || post.configuration_id.trim() === '') {
        throw new Error('Configuration ID cannot be empty');
      }

      // Ensure created_at is valid
      let createdAt = post.created_at;
      if (!createdAt || isNaN(new Date(createdAt).getTime())) {
        createdAt = new Date().toISOString();
      }
      
      console.log(`[PostStorage] Attempting to store ${post.platform} post ${post.post_id} for config ${post.configuration_id}`);

      // Check if post already exists (reject duplicates)
      const { data: existingPost, error: checkError } = await supabase
        .from('posts')
        .select('id')
        .eq('platform', post.platform)
        .eq('post_id', post.post_id)
        .limit(1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned (expected for new posts)
        console.error(`[PostStorage] Error checking for duplicate ${post.platform} post ${post.post_id}:`, checkError);
        throw checkError;
      }

      // If post exists, reject it (don't store)
      if (existingPost) {
        console.log(`[PostStorage] ❌ Rejected duplicate ${post.platform} post: ${post.post_id} (already exists)`);
        return; // Exit early, don't store
      }

      // Post doesn't exist, insert it
      const { error: insertError, data: insertedData } = await supabase
        .from('posts')
        .insert({
          platform: post.platform,
          post_id: post.post_id,
          content: post.content || '',
          title: post.title || null,
          created_at: createdAt,
          post_url: post.post_url || '',
          author_id: post.author_id || null,
          author_username: post.author_username || null,
          author_name: post.author_name || null,
          author_verified: post.author_verified || false,
          author_followers: post.author_followers || null,
          author_following: post.author_following || null,
          author_profile_image: post.author_profile_image || null,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          shares_count: post.shares_count || 0,
          retweets_count: post.retweets_count || null,
          upvotes_count: post.upvotes_count || null,
          media_urls: post.media_urls || [],
          media_types: post.media_types || [],
          thumbnail_url: post.thumbnail_url || null,
          raw_data: post.raw_data || null,
          configuration_id: post.configuration_id,
          fetched_at: new Date().toISOString(),
        })
        .select();

      if (insertError) {
        console.error(`[PostStorage] Error storing ${post.platform} post ${post.post_id}:`, insertError);
        console.error('[PostStorage] Error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        });
        console.error('[PostStorage] Post data:', {
          platform: post.platform,
          post_id: post.post_id,
          content_length: post.content?.length,
          configuration_id: post.configuration_id,
        });
        throw insertError;
      }

      if (insertedData && insertedData.length > 0) {
        console.log(`[PostStorage] ✅ Successfully stored ${post.platform} post: ${post.post_id} (ID: ${insertedData[0].id})`);
      } else {
        console.log(`[PostStorage] ⚠️ Post ${post.post_id} was not inserted (unexpected)`);
      }
    } catch (error: any) {
      console.error(`[PostStorage] Failed to store ${post.platform} post:`, error.message);
      throw error;
    }
  }
}
