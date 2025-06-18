-- Insert sample mental health centers in Rwanda
INSERT INTO mental_health_centers (name, location, phone, email, address, services, operating_hours, is_emergency, is_active) VALUES 
(
  'Ndera Neuropsychiatric Hospital',
  'Gasabo District, Kigali',
  '+250 788 123 456',
  'info@ndera.gov.rw',
  'Ndera, Gasabo District, Kigali City',
  ARRAY['Mental Health Treatment', 'Psychiatric Care', 'Counseling', 'Emergency Services'],
  '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00", "saturday": "08:00-12:00", "sunday": "Emergency Only"}',
  true,
  true
),
(
  'University of Rwanda Mental Health Clinic',
  'Huye District, Southern Province',
  '+250 788 234 567',
  'mentalhealth@ur.ac.rw',
  'University of Rwanda, Huye Campus',
  ARRAY['Student Counseling', 'Therapy', 'Mental Health Assessment', 'Support Groups'],
  '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}',
  false,
  true
),
(
  'Kigali Mental Health Center',
  'Nyarugenge District, Kigali',
  '+250 788 345 678',
  'info@kigalimental.rw',
  'KN 15 Ave, Nyarugenge, Kigali',
  ARRAY['Individual Therapy', 'Group Therapy', 'Family Counseling', 'Crisis Intervention'],
  '{"monday": "07:00-19:00", "tuesday": "07:00-19:00", "wednesday": "07:00-19:00", "thursday": "07:00-19:00", "friday": "07:00-19:00", "saturday": "08:00-16:00"}',
  true,
  true
),
(
  'Butare Mental Health Support Center',
  'Huye District, Southern Province',
  '+250 788 456 789',
  'support@butaremental.rw',
  'Butare Town, Huye District',
  ARRAY['Counseling', 'Mental Health Education', 'Community Outreach', 'Peer Support'],
  '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}',
  false,
  true
),
(
  'Rwanda Mental Health Helpline',
  'Nationwide',
  '+250 788 567 890',
  'help@rwandamental.rw',
  'Available 24/7 Nationwide',
  ARRAY['Crisis Hotline', 'Telephone Counseling', 'Emergency Support', 'Referral Services'],
  '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}',
  true,
  true
)
ON CONFLICT DO NOTHING;

-- Insert sample journal entries for demo
INSERT INTO journal_entries (student_id, title, content, mood, tags) 
SELECT 
  s.id,
  'First Week Reflections',
  'Starting university has been both exciting and overwhelming. I''m adjusting to the new environment and making new friends.',
  'mixed',
  ARRAY['university', 'adjustment', 'social']
FROM students s
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample user settings
INSERT INTO user_settings (user_id, notifications_enabled, email_notifications, reminder_frequency, privacy_level)
SELECT 
  u.id,
  true,
  true,
  'weekly',
  'private'
FROM users u
WHERE u.role = 'student'
ON CONFLICT (user_id) DO NOTHING;
