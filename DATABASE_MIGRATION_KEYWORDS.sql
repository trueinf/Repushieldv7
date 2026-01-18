-- Database Migration for RepuShield v5
-- Add keywords column to posts table

-- Step 1: Add the keywords column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb;

-- Step 2: Verify the column was added (optional check)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name = 'keywords';

-- Expected result:
-- column_name | data_type | is_nullable
-- keywords     | jsonb     | YES






