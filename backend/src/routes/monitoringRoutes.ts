import { Router } from 'express';
import { PostFetchScheduler } from '../services/scheduler.js';

const router = Router();

let schedulerInstance: PostFetchScheduler | null = null;

export function setSchedulerInstance(scheduler: PostFetchScheduler): void {
  schedulerInstance = scheduler;
}

router.get('/status', (req, res) => {
  try {
    if (!schedulerInstance) {
      return res.status(503).json({
        success: false,
        error: 'Scheduler not initialized',
      });
    }

    const status = schedulerInstance.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get monitoring status',
    });
  }
});

router.post('/pause', (req, res) => {
  try {
    if (!schedulerInstance) {
      return res.status(503).json({
        success: false,
        error: 'Scheduler not initialized',
      });
    }

    schedulerInstance.pause();
    const status = schedulerInstance.getStatus();
    
    res.json({
      success: true,
      message: 'Monitoring paused',
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pause monitoring',
    });
  }
});

router.post('/resume', (req, res) => {
  try {
    if (!schedulerInstance) {
      return res.status(503).json({
        success: false,
        error: 'Scheduler not initialized',
      });
    }

    schedulerInstance.resume();
    const status = schedulerInstance.getStatus();
    
    res.json({
      success: true,
      message: 'Monitoring resumed',
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resume monitoring',
    });
  }
});

router.post('/stop', (req, res) => {
  try {
    if (!schedulerInstance) {
      return res.status(503).json({
        success: false,
        error: 'Scheduler not initialized',
      });
    }

    schedulerInstance.stop();
    const status = schedulerInstance.getStatus();
    
    res.json({
      success: true,
      message: 'Monitoring stopped',
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop monitoring',
    });
  }
});

export default router;

