-- First, let's check what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
ORDER BY ordinal_position;

-- Safely add missing columns to assessments table
DO $$ 
BEGIN
    -- Add predicted_conditions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'predicted_conditions') THEN
        ALTER TABLE assessments ADD COLUMN predicted_conditions TEXT[];
        CREATE INDEX IF NOT EXISTS idx_assessments_predicted_conditions ON assessments USING GIN(predicted_conditions);
    END IF;
    
    -- Add predicted_risk_level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'predicted_risk_level') THEN
        ALTER TABLE assessments ADD COLUMN predicted_risk_level VARCHAR(20);
        ALTER TABLE assessments ADD CONSTRAINT check_predicted_risk_level 
            CHECK (predicted_risk_level IN ('low', 'moderate', 'critical'));
        CREATE INDEX IF NOT EXISTS idx_assessments_predicted_risk_level ON assessments(predicted_risk_level);
    END IF;
    
    -- Add predicted_sentiment column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'predicted_sentiment') THEN
        ALTER TABLE assessments ADD COLUMN predicted_sentiment VARCHAR(20);
        ALTER TABLE assessments ADD CONSTRAINT check_predicted_sentiment 
            CHECK (predicted_sentiment IN ('positive', 'negative', 'neutral'));
    END IF;
    
    -- Ensure sentiment_score exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'sentiment_score') THEN
        ALTER TABLE assessments ADD COLUMN sentiment_score INTEGER;
        CREATE INDEX IF NOT EXISTS idx_assessments_sentiment_score ON assessments(sentiment_score);
    END IF;
    
    -- Ensure sentiment_label exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'sentiment_label') THEN
        ALTER TABLE assessments ADD COLUMN sentiment_label VARCHAR(20);
        ALTER TABLE assessments ADD CONSTRAINT check_sentiment_label 
            CHECK (sentiment_label IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive'));
        CREATE INDEX IF NOT EXISTS idx_assessments_sentiment_label ON assessments(sentiment_label);
    END IF;
    
    -- Add back score columns for compatibility
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'anxiety_score') THEN
        ALTER TABLE assessments ADD COLUMN anxiety_score INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'depression_score') THEN
        ALTER TABLE assessments ADD COLUMN depression_score INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'stress_score') THEN
        ALTER TABLE assessments ADD COLUMN stress_score INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'overall_wellbeing_score') THEN
        ALTER TABLE assessments ADD COLUMN overall_wellbeing_score INTEGER;
    END IF;
    
END $$;

-- Refresh the schema cache
ANALYZE assessments;

-- Show the final schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
ORDER BY ordinal_position;
