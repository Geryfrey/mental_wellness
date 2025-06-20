-- Add requires_mental_health_professional column to assessments table if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' AND column_name = 'requires_mental_health_professional'
    ) THEN
        ALTER TABLE assessments ADD COLUMN requires_mental_health_professional BOOLEAN DEFAULT NULL;
        CREATE INDEX IF NOT EXISTS idx_assessments_requires_mhp ON assessments(requires_mental_health_professional);
    END IF;
END $$;

-- Refresh the schema cache
ANALYZE assessments;
