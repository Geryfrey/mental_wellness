-- Add sentiment analysis columns to existing assessments table
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS sentiment_score INTEGER,
ADD COLUMN IF NOT EXISTS sentiment_label VARCHAR(20) CHECK (sentiment_label IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive'));

-- Add index for sentiment queries
CREATE INDEX IF NOT EXISTS idx_assessments_sentiment_label ON assessments(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_assessments_sentiment_score ON assessments(sentiment_score);
