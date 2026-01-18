import { Router, Request, Response } from 'express';
import { ConfigurationService } from '../services/configurationService.js';
import { configurationSchema } from '../validation/configurationSchema.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const configs = ConfigurationService.getAll();
    res.json({
      success: true,
      data: configs,
      count: configs.length,
    });
  } catch (error) {
    throw new Error('Failed to fetch configurations');
  }
});

router.get('/active', (req: Request, res: Response) => {
  try {
    const config = ConfigurationService.getActive();
    // Return 200 with null data instead of 404 to avoid console errors
    res.json({
      success: true,
      data: config || null,
    });
  } catch (error) {
    throw new Error('Failed to fetch active configuration');
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = ConfigurationService.getById(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Configuration with id ${id} not found`,
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    throw new Error('Failed to fetch configuration');
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const validated = configurationSchema.parse(req.body);
    const config = ConfigurationService.create(validated);
    
    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      data: config,
    });
  } catch (error) {
    throw error;
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = ConfigurationService.getById(id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Configuration with id ${id} not found`,
      });
    }

    const validated = configurationSchema.partial().parse(req.body);
    const updated = ConfigurationService.update(id, validated);
    
    if (!updated) {
      throw new Error('Failed to update configuration');
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: updated,
    });
  } catch (error) {
    throw error;
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = ConfigurationService.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Configuration with id ${id} not found`,
      });
    }

    res.json({
      success: true,
      message: 'Configuration deleted successfully',
    });
  } catch (error) {
    throw new Error('Failed to delete configuration');
  }
});

router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = ConfigurationService.activate(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Configuration with id ${id} not found`,
      });
    }

    // Trigger immediate fetch
    try {
      const { PostFetchScheduler } = await import('../services/scheduler.js');
      const rapidApiKey = process.env.RAPIDAPI_KEY!;
      const serpApiKey = process.env.SERPAPI_KEY!;
      const openaiApiKey = process.env.OPENAI_API_KEY || '';
      const scheduler = new PostFetchScheduler(rapidApiKey, serpApiKey, openaiApiKey);
      await scheduler.triggerManualFetch(id);
    } catch (fetchError: any) {
      console.error('Error triggering immediate fetch:', fetchError);
    }

    res.json({
      success: true,
      message: 'Configuration activated successfully. Post fetching started.',
      data: config,
    });
  } catch (error) {
    throw new Error('Failed to activate configuration');
  }
});

export default router;
