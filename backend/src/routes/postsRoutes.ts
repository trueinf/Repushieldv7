import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { TranslationService } from '../services/translationService.js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const translationService = process.env.OPENAI_API_KEY 
  ? new TranslationService(process.env.OPENAI_API_KEY)
  : null;

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      platform,
      configuration_id,
      limit = 1000, // Increased default limit to show more posts
      offset = 0,
      sort = 'created_at',
      order = 'desc',
    } = req.query;

    let query = supabase
      .from('posts')
      .select('*')
      .order(sort as string, { ascending: order === 'asc' })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (configuration_id) {
      query = query.eq('configuration_id', configuration_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Log for debugging
    const platformCounts = (data || []).reduce((acc: any, post: any) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {});
    console.log(`[Posts API] Fetched ${data?.length || 0} posts. Platform breakdown:`, platformCounts);

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
      message: error.message,
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Post not found',
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post',
      message: error.message,
    });
  }
});

// Translate post content to English
router.post('/:id/translate', async (req: Request, res: Response) => {
  try {
    if (!translationService) {
      return res.status(503).json({
        success: false,
        error: 'Translation service unavailable',
        message: 'OPENAI_API_KEY is not configured',
      });
    }

    const { id } = req.params;

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, content, title, raw_data')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Post not found',
        });
      }
      throw fetchError;
    }

    // Get text to translate (content or title)
    const textToTranslate = post.content || post.title || '';
    
    if (!textToTranslate || textToTranslate.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Post has no content to translate',
      });
    }

    // Translate the text
    const translatedText = await translationService.translateToEnglish(textToTranslate);

    // Update the post with translated content
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        content: translatedText,
        // Store original in raw_data if needed
        raw_data: {
          ...(post.raw_data || {}),
          original_content: post.content,
          translated_at: new Date().toISOString(),
        },
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: {
        id: post.id,
        originalText: textToTranslate,
        translatedText: translatedText,
      },
      message: 'Post translated successfully',
    });
  } catch (error: any) {
    console.error('[Posts API] Translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      message: error.message,
    });
  }
});

export default router;
