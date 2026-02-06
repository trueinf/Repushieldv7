-- Create researches table
CREATE TABLE IF NOT EXISTS researches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Done', 'Failed')),
  model VARCHAR(100) NOT NULL,
  options JSONB DEFAULT '{}'::jsonb,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research_reports table
CREATE TABLE IF NOT EXISTS research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  executive_summary TEXT,
  key_findings JSONB DEFAULT '[]'::jsonb,
  detailed_analysis TEXT,
  insights TEXT,
  conclusion TEXT,
  sources JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_research_report UNIQUE(research_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_researches_status ON researches(status);
CREATE INDEX IF NOT EXISTS idx_researches_created_at ON researches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_reports_research_id ON research_reports(research_id);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_researches_updated_at 
  BEFORE UPDATE ON researches 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_reports_updated_at 
  BEFORE UPDATE ON research_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE researches ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth setup)
CREATE POLICY "Allow all operations" ON researches FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON research_reports FOR ALL USING (true);












