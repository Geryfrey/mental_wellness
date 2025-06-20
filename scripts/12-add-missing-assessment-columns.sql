-- Add missing columns to assessments table that the application expects

DO $$ 
BEGIN
    -- Add score column (general score)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'score') THEN
        ALTER TABLE assessments ADD COLUMN score INTEGER;
        CREATE INDEX IF NOT EXISTS idx_assessments_score ON assessments(score);
    END IF;
    
    -- Add analysis column (for AI analysis text)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'analysis') THEN
        ALTER TABLE assessments ADD COLUMN analysis TEXT;
    END IF;
    
    -- Add immediate_actions column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'immediate_actions') THEN
        ALTER TABLE assessments ADD COLUMN immediate_actions TEXT[];
    END IF;
    
    -- Add professional_help_needed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'professional_help_needed') THEN
        ALTER TABLE assessments ADD COLUMN professional_help_needed BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_assessments_professional_help_needed ON assessments(professional_help_needed);
    END IF;
    
    -- Add crisis_indicators column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'crisis_indicators') THEN
        ALTER TABLE assessments ADD COLUMN crisis_indicators BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_assessments_crisis_indicators ON assessments(crisis_indicators);
    END IF;
    
    -- Ensure overall_wellbeing_score exists (it should from previous scripts)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'overall_wellbeing_score') THEN
        ALTER TABLE assessments ADD COLUMN overall_wellbeing_score INTEGER;
        CREATE INDEX IF NOT EXISTS idx_assessments_overall_wellbeing_score ON assessments(overall_wellbeing_score);
    END IF;

END $$;

-- Refresh the schema cache
ANALYZE assessments;

-- Show the current schema to verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'assessments' 
ORDER BY ordinal_position;
