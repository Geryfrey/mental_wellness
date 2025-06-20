-- Ensure predicted columns exist in assessments table
DO $$ 
BEGIN
    -- Add predicted_conditions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'predicted_conditions'
    ) THEN
        ALTER TABLE assessments ADD COLUMN predicted_conditions TEXT[];
    END IF;

    -- Add predicted_risk_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'predicted_risk_level'
    ) THEN
        ALTER TABLE assessments ADD COLUMN predicted_risk_level VARCHAR(20) 
        CHECK (predicted_risk_level IN ('low', 'moderate', 'high', 'critical'));
    END IF;

    -- Add predicted_sentiment column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'predicted_sentiment'
    ) THEN
        ALTER TABLE assessments ADD COLUMN predicted_sentiment VARCHAR(20) 
        CHECK (predicted_sentiment IN ('positive', 'negative', 'neutral'));
    END IF;

    -- Add sentiment_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'sentiment_score'
    ) THEN
        ALTER TABLE assessments ADD COLUMN sentiment_score INTEGER 
        CHECK (sentiment_score >= 0 AND sentiment_score <= 100);
    END IF;

    -- Add sentiment_label column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'sentiment_label'
    ) THEN
        ALTER TABLE assessments ADD COLUMN sentiment_label VARCHAR(20) 
        CHECK (sentiment_label IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive'));
    END IF;

    -- Add analysis column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'analysis'
    ) THEN
        ALTER TABLE assessments ADD COLUMN analysis TEXT;
    END IF;

    -- Add recommendations column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'recommendations'
    ) THEN
        ALTER TABLE assessments ADD COLUMN recommendations TEXT[];
    END IF;

    -- Add immediate_actions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'immediate_actions'
    ) THEN
        ALTER TABLE assessments ADD COLUMN immediate_actions TEXT[];
    END IF;

    -- Add professional_help_needed column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'professional_help_needed'
    ) THEN
        ALTER TABLE assessments ADD COLUMN professional_help_needed BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add crisis_indicators column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'crisis_indicators'
    ) THEN
        ALTER TABLE assessments ADD COLUMN crisis_indicators BOOLEAN DEFAULT FALSE;
    END IF;

END $$;

-- Update table statistics
ANALYZE assessments;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN (
    'predicted_conditions', 
    'predicted_risk_level', 
    'predicted_sentiment',
    'sentiment_score',
    'sentiment_label',
    'analysis',
    'recommendations',
    'immediate_actions',
    'professional_help_needed',
    'crisis_indicators'
)
ORDER BY column_name;
