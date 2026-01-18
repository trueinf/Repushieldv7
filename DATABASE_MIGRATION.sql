-- Database Migration for RepuShield v5
-- Add fact_check_data column to posts table

-- Step 1: Add the fact_check_data column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS fact_check_data JSONB;

-- Step 2: Verify the column was added (optional check)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name = 'fact_check_data';

-- Expected result:
-- column_name      | data_type | is_nullable
-- fact_check_data  | jsonb     | YES







