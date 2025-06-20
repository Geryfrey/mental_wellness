-- Add wellness_score column to assessments table if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' AND column_name = 'wellness_score'
    ) THEN
        ALTER TABLE assessments ADD COLUMN wellness_score INTEGER DEFAULT NULL;
        CREATE INDEX IF NOT EXISTS idx_assessments_wellness_score ON assessments(wellness_score);
    END IF;
END $$;

-- Refresh the schema cache
ANALYZE assessments;
