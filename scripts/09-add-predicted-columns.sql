-- Add missing predicted columns to assessments table
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS predicted_conditions TEXT[],
ADD COLUMN IF NOT EXISTS predicted_risk_level VARCHAR(20) CHECK (predicted_risk_level IN ('low', 'moderate', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS predicted_sentiment VARCHAR(20) CHECK (predicted_sentiment IN ('positive', 'negative', 'neutral'));

-- Update the table statistics
ANALYZE assessments;

-- Verify the new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN ('predicted_conditions', 'predicted_risk_level', 'predicted_sentiment')
ORDER BY column_name;
