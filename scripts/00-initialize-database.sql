-- Initialize the mental health assessment platform database
-- This script sets up the complete schema and initial data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'counselor', 'admin', 'super_admin');
CREATE TYPE assessment_status AS ENUM ('in_progress', 'completed', 'reviewed');
CREATE TYPE risk_level AS ENUM ('low', 'moderate', 'high', 'critical');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'student',
    phone TEXT,
    date_of_birth DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_profiles table for additional student information
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id TEXT UNIQUE,
    year_level INTEGER,
    course TEXT,
    department TEXT,
    academic_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Mental Health Assessment',
    responses JSONB NOT NULL DEFAULT '{}',
    ai_analysis JSONB,
    sentiment_score DECIMAL(5,2),
    risk_level risk_level,
    status assessment_status DEFAULT 'in_progress',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mental_health_centers table
CREATE TABLE IF NOT EXISTS mental_health_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    services TEXT[],
    operating_hours JSONB,
    emergency_available BOOLEAN DEFAULT false,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    counselor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    center_id UUID REFERENCES mental_health_centers(id) ON DELETE SET NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status appointment_status DEFAULT 'scheduled',
    notes TEXT,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    resource_type TEXT NOT NULL, -- 'article', 'video', 'audio', 'pdf', 'link'
    url TEXT,
    tags TEXT[],
    target_conditions TEXT[], -- 'anxiety', 'depression', 'stress', etc.
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_level ON assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_appointments_student_id ON appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_counselor_id ON appointments(counselor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_published ON resources(is_published);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_health_centers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Student profiles: Students can view and update their own profile
CREATE POLICY "Students can view own student profile" ON student_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update own student profile" ON student_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Assessments: Users can view and create their own assessments
CREATE POLICY "Users can view own assessments" ON assessments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessments" ON assessments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON assessments
    FOR UPDATE USING (auth.uid() = user_id);

-- Appointments: Students can view their own appointments
CREATE POLICY "Students can view own appointments" ON appointments
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Resources: Everyone can view published resources
CREATE POLICY "Anyone can view published resources" ON resources
    FOR SELECT USING (is_published = true);

-- Mental health centers: Everyone can view centers
CREATE POLICY "Anyone can view mental health centers" ON mental_health_centers
    FOR SELECT USING (true);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mental_health_centers_updated_at BEFORE UPDATE ON mental_health_centers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
-- Create super admin user (you'll need to sign up with this email first)
INSERT INTO profiles (id, email, full_name, role) 
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@mentalhealth.edu',
    'System Administrator',
    'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample mental health centers
INSERT INTO mental_health_centers (name, address, phone, email, services, emergency_available) VALUES
('University Counseling Center', '123 Campus Drive, University City', '+1-555-0123', 'counseling@university.edu', ARRAY['individual_therapy', 'group_therapy', 'crisis_intervention'], true),
('Community Mental Health Clinic', '456 Main Street, Downtown', '+1-555-0456', 'info@communitymh.org', ARRAY['therapy', 'psychiatric_services', 'support_groups'], false),
('Crisis Support Center', '789 Emergency Ave, City Center', '+1-555-0789', 'crisis@support.org', ARRAY['crisis_intervention', '24_7_hotline', 'emergency_services'], true)
ON CONFLICT DO NOTHING;

-- Insert sample resources
INSERT INTO resources (title, description, content, resource_type, url, tags, target_conditions, is_featured) VALUES
('Managing Anxiety: A Student Guide', 'Comprehensive guide for students dealing with anxiety', 'Detailed content about anxiety management techniques...', 'article', null, ARRAY['anxiety', 'students', 'coping'], ARRAY['anxiety'], true),
('Meditation for Beginners', '10-minute guided meditation session', 'Audio content for relaxation and mindfulness...', 'audio', 'https://example.com/meditation.mp3', ARRAY['meditation', 'mindfulness', 'relaxation'], ARRAY['stress', 'anxiety'], false),
('Depression Support Resources', 'Links to professional depression support', 'List of professional resources and support groups...', 'link', 'https://example.com/depression-support', ARRAY['depression', 'support', 'professional'], ARRAY['depression'], true)
ON CONFLICT DO NOTHING;

COMMIT;
