-- Topics and Narratives Grouping Tables
-- This schema supports dynamic grouping of posts by shared topics/keywords

-- Topics Table: Groups posts that share common topics or keywords
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('emerging', 'active', 'stabilizing', 'dormant')),
  
  -- Aggregated keywords and topics from all posts in this group
  aggregated_topics JSONB DEFAULT '[]'::jsonb,
  aggregated_keywords JSONB DEFAULT '[]'::jsonb,
  
  -- Analytics (calculated from grouped posts)
  post_count INTEGER DEFAULT 0,
  average_risk_score DECIMAL(3,1),
  sentiment_distribution JSONB DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}'::jsonb,
  platform_distribution JSONB DEFAULT '{"twitter": 0, "reddit": 0, "facebook": 0, "news": 0}'::jsonb,
  total_engagement INTEGER DEFAULT 0,
  
  -- Velocity tracking
  velocity VARCHAR(20) DEFAULT 'stable' CHECK (velocity IN ('rising', 'stable', 'declining')),
  trend_data JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  configuration_id UUID,
  
  -- Constraints
  CONSTRAINT unique_topic_name_config UNIQUE(name, configuration_id)
);

-- Narratives Table: Groups posts that share common topics/keywords (same grouping logic as topics)
CREATE TABLE IF NOT EXISTS narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  type VARCHAR(50) DEFAULT 'reputational' CHECK (type IN ('reputational', 'political', 'operational', 'ethical', 'safety', 'misinformation')),
  status VARCHAR(20) DEFAULT 'emerging' CHECK (status IN ('emerging', 'established', 'entrenched', 'declining')),
  
  -- Aggregated keywords and topics from all posts in this group
  aggregated_topics JSONB DEFAULT '[]'::jsonb,
  aggregated_keywords JSONB DEFAULT '[]'::jsonb,
  
  -- Analytics (calculated from grouped posts)
  post_count INTEGER DEFAULT 0,
  average_risk_score DECIMAL(3,1),
  sentiment_distribution JSONB DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}'::jsonb,
  platform_distribution JSONB DEFAULT '{"twitter": 0, "reddit": 0, "facebook": 0, "news": 0}'::jsonb,
  total_engagement INTEGER DEFAULT 0,
  
  -- Narrative-specific metrics
  strength_score INTEGER DEFAULT 0,
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  persistence_days INTEGER DEFAULT 0,
  amplification_velocity INTEGER DEFAULT 0,
  contributing_topics_count INTEGER DEFAULT 0,
  
  -- Velocity tracking
  velocity VARCHAR(20) DEFAULT 'stable' CHECK (velocity IN ('rising', 'stable', 'declining')),
  trend_data JSONB DEFAULT '[]'::jsonb,
  key_frames JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  first_emergence_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  configuration_id UUID,
  
  -- Constraints
  CONSTRAINT unique_narrative_title_config UNIQUE(title, configuration_id)
);

-- Topic-Post Mapping: Many-to-many relationship
CREATE TABLE IF NOT EXISTS topic_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  matched_by VARCHAR(50) NOT NULL, -- 'topic' or 'keyword'
  matched_value VARCHAR(255) NOT NULL, -- the actual topic/keyword that matched
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_topic_post UNIQUE(topic_id, post_id)
);

-- Narrative-Post Mapping: Many-to-many relationship
CREATE TABLE IF NOT EXISTS narrative_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_id UUID NOT NULL REFERENCES narratives(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  matched_by VARCHAR(50) NOT NULL, -- 'topic' or 'keyword'
  matched_value VARCHAR(255) NOT NULL, -- the actual topic/keyword that matched
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_narrative_post UNIQUE(narrative_id, post_id)
);

-- Semantic Similarity Mapping: Stores related terms for better grouping
CREATE TABLE IF NOT EXISTS semantic_similarity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term1 VARCHAR(255) NOT NULL,
  term2 VARCHAR(255) NOT NULL,
  similarity_score DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_term_pair UNIQUE(term1, term2)
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_topics_configuration_id ON topics(configuration_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_last_updated ON topics(last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_risk_score ON topics(average_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_topics_aggregated_topics ON topics USING GIN(aggregated_topics);
CREATE INDEX IF NOT EXISTS idx_topics_aggregated_keywords ON topics USING GIN(aggregated_keywords);

CREATE INDEX IF NOT EXISTS idx_narratives_configuration_id ON narratives(configuration_id);
CREATE INDEX IF NOT EXISTS idx_narratives_status ON narratives(status);
CREATE INDEX IF NOT EXISTS idx_narratives_risk_level ON narratives(risk_level);
CREATE INDEX IF NOT EXISTS idx_narratives_last_updated ON narratives(last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_narratives_strength_score ON narratives(strength_score DESC);
CREATE INDEX IF NOT EXISTS idx_narratives_aggregated_topics ON narratives USING GIN(aggregated_topics);
CREATE INDEX IF NOT EXISTS idx_narratives_aggregated_keywords ON narratives USING GIN(aggregated_keywords);

CREATE INDEX IF NOT EXISTS idx_topic_posts_topic_id ON topic_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_posts_post_id ON topic_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_topic_posts_matched_by ON topic_posts(matched_by);

CREATE INDEX IF NOT EXISTS idx_narrative_posts_narrative_id ON narrative_posts(narrative_id);
CREATE INDEX IF NOT EXISTS idx_narrative_posts_post_id ON narrative_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_narrative_posts_matched_by ON narrative_posts(matched_by);

CREATE INDEX IF NOT EXISTS idx_semantic_similarity_term1 ON semantic_similarity(term1);
CREATE INDEX IF NOT EXISTS idx_semantic_similarity_term2 ON semantic_similarity(term2);

