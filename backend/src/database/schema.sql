-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('twitter', 'reddit', 'facebook', 'news')),
  post_id VARCHAR(255) NOT NULL,
  content TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  post_url TEXT NOT NULL,
  
  -- Author Information
  author_id VARCHAR(255),
  author_username VARCHAR(255),
  author_name VARCHAR(255),
  author_verified BOOLEAN DEFAULT false,
  author_followers INTEGER,
  author_following INTEGER,
  author_profile_image TEXT,
  
  -- Engagement Metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  retweets_count INTEGER DEFAULT 0,
  upvotes_count INTEGER DEFAULT 0,
  
  -- Media
  media_urls JSONB DEFAULT '[]'::jsonb,
  media_types JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  
  -- Analysis Fields
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  risk_score DECIMAL(3,1),
  narrative TEXT,
  topics JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  fact_check_data JSONB,
  
  -- Metadata
  configuration_id UUID,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB,
  
  -- Constraints
  CONSTRAINT unique_platform_post UNIQUE(platform, post_id)
);

-- Create Indexes for Posts
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_configuration_id ON posts(configuration_id);
CREATE INDEX IF NOT EXISTS idx_posts_fetched_at ON posts(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_posts_risk_score ON posts(risk_score DESC);

-- Authors Table (for analytics)
CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  name VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  followers INTEGER,
  following INTEGER,
  profile_image TEXT,
  bio TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_platform_author UNIQUE(platform, author_id)
);

-- Create Indexes for Authors
CREATE INDEX IF NOT EXISTS idx_authors_platform ON authors(platform);
CREATE INDEX IF NOT EXISTS idx_authors_username ON authors(username);

-- Fetch Jobs Table (for tracking)
CREATE TABLE IF NOT EXISTS fetch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  posts_fetched INTEGER DEFAULT 0,
  posts_stored INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for Fetch Jobs
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_configuration_id ON fetch_jobs(configuration_id);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_platform ON fetch_jobs(platform);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_status ON fetch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_created_at ON fetch_jobs(created_at DESC);
