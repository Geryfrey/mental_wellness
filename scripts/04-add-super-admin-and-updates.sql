-- Add super_admin role to users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'health_professional', 'admin', 'super_admin'));

-- Add registration_number to students table (check if column exists first)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'registration_number') THEN
        ALTER TABLE students ADD COLUMN registration_number VARCHAR(9) UNIQUE;
        ALTER TABLE students ADD CONSTRAINT check_registration_number CHECK (registration_number ~ '^2[0-9]{8}$');
    END IF;
END $$;

-- Update assessments table to use labels instead of scores
DO $$
BEGIN
    -- Drop old score columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'anxiety_score') THEN
        ALTER TABLE assessments DROP COLUMN anxiety_score;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'depression_score') THEN
        ALTER TABLE assessments DROP COLUMN depression_score;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'stress_score') THEN
        ALTER TABLE assessments DROP COLUMN stress_score;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'overall_wellbeing_score') THEN
        ALTER TABLE assessments DROP COLUMN overall_wellbeing_score;
    END IF;
    
    -- Add new prediction columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'predicted_conditions') THEN
        ALTER TABLE assessments ADD COLUMN predicted_conditions TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'predicted_risk_level') THEN
        ALTER TABLE assessments ADD COLUMN predicted_risk_level VARCHAR(20) CHECK (predicted_risk_level IN ('low', 'moderate', 'critical'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'predicted_sentiment') THEN
        ALTER TABLE assessments ADD COLUMN predicted_sentiment VARCHAR(20) CHECK (predicted_sentiment IN ('positive', 'negative', 'neutral'));
    END IF;
END $$;

-- Create mental health centers table
CREATE TABLE IF NOT EXISTS mental_health_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  services TEXT[],
  operating_hours JSONB,
  is_emergency BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  mood VARCHAR(50),
  tags TEXT[],
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  reminder_frequency VARCHAR(20) DEFAULT 'weekly',
  privacy_level VARCHAR(20) DEFAULT 'private',
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table for admin reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  period_type VARCHAR(20) CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  data JSONB NOT NULL,
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_registration_number ON students(registration_number);
CREATE INDEX IF NOT EXISTS idx_assessments_predicted_conditions ON assessments USING GIN(predicted_conditions);
CREATE INDEX IF NOT EXISTS idx_assessments_predicted_risk_level ON assessments(predicted_risk_level);
CREATE INDEX IF NOT EXISTS idx_journal_entries_student_id ON journal_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_period_type ON reports(period_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Insert super admin user if it doesn't exist
INSERT INTO users (email, full_name, role) VALUES 
('superadmin@wellness.edu', 'Super Administrator', 'super_admin')
ON CONFLICT (email) DO NOTHING;
