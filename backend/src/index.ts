import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import configurationRoutes from './routes/configurationRoutes.js';
import postsRoutes from './routes/postsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import topicsRoutes from './routes/topicsRoutes.js';
import narrativesRoutes from './routes/narrativesRoutes.js';
import monitoringRoutes, { setSchedulerInstance } from './routes/monitoringRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { PostFetchScheduler } from './services/scheduler.js';
import { supabase } from './config/supabase.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FETCH_INTERVAL = parseInt(process.env.FETCH_INTERVAL_MINUTES || '10', 10);

if (!RAPIDAPI_KEY || !SERPAPI_KEY) {
  console.error('Missing API keys. Please check your .env file.');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not found. Risk scoring will be disabled.');
}

// CORS configuration - supports multiple origins for development and production
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.error(`CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { error: dbError } = await supabase.from('posts').select('id').limit(1);
    
    res.json({
      success: true,
      message: 'RepuShield API is running',
      timestamp: new Date().toISOString(),
      database: dbError ? { connected: false, error: dbError.message } : { connected: true },
    });
  } catch (error: any) {
    res.json({
      success: true,
      message: 'RepuShield API is running',
      timestamp: new Date().toISOString(),
      database: { connected: false, error: error.message },
    });
  }
});

app.use('/api/configurations', configurationRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/narratives', narrativesRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const scheduler = new PostFetchScheduler(RAPIDAPI_KEY, SERPAPI_KEY, OPENAI_API_KEY || '', FETCH_INTERVAL);
setSchedulerInstance(scheduler);
scheduler.start();

app.listen(PORT, () => {
  console.log(`🚀 RepuShield API server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`⏰ Post fetcher scheduled every ${FETCH_INTERVAL} minutes`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other process or change the PORT in .env`);
    process.exit(1);
  } else {
    throw err;
  }
});
