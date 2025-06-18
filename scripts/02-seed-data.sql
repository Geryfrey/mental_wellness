-- Insert sample admin user
INSERT INTO users (email, full_name, role) VALUES 
('admin@wellness.edu', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample health professional
INSERT INTO users (email, full_name, role) VALUES 
('dr.smith@wellness.edu', 'Dr. Sarah Smith', 'health_professional')
ON CONFLICT (email) DO NOTHING;

-- Get the health professional user ID and insert into health_professionals table
INSERT INTO health_professionals (user_id, license_number, specialization, phone, location, is_approved)
SELECT id, 'PSY-12345', 'Clinical Psychology', '+1-555-0123', 'Campus Health Center', true
FROM users WHERE email = 'dr.smith@wellness.edu'
ON CONFLICT DO NOTHING;

-- Insert sample resources
INSERT INTO resources (title, description, content, resource_type, category, tags, is_featured, created_by) VALUES 
(
  'Managing Anxiety: A Student Guide',
  'Comprehensive guide for students dealing with anxiety',
  'Anxiety is a normal response to stress, but when it becomes overwhelming, it can interfere with daily activities...',
  'article',
  'anxiety',
  ARRAY['anxiety', 'coping', 'students'],
  true,
  (SELECT id FROM users WHERE email = 'admin@wellness.edu')
),
(
  'Mindfulness Meditation for Beginners',
  'Learn basic mindfulness techniques to reduce stress',
  'Mindfulness meditation is a powerful tool for managing stress and improving mental wellbeing...',
  'article',
  'stress',
  ARRAY['mindfulness', 'meditation', 'stress'],
  true,
  (SELECT id FROM users WHERE email = 'admin@wellness.edu')
),
(
  'Depression: Understanding and Seeking Help',
  'Information about depression and available support',
  'Depression is more than just feeling sad. It is a serious mental health condition...',
  'article',
  'depression',
  ARRAY['depression', 'support', 'help'],
  true,
  (SELECT id FROM users WHERE email = 'admin@wellness.edu')
),
(
  'Crisis Hotline Numbers',
  'Emergency mental health resources and contact information',
  'National Suicide Prevention Lifeline: 988\nCrisis Text Line: Text HOME to 741741\nCampus Counseling: +1-555-HELP',
  'external_link',
  'crisis',
  ARRAY['crisis', 'emergency', 'hotline'],
  true,
  (SELECT id FROM users WHERE email = 'admin@wellness.edu')
)
ON CONFLICT DO NOTHING;
