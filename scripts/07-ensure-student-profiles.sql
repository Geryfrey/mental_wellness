-- Create student profiles for any users with student role who don't have one
INSERT INTO students (user_id)
SELECT u.id
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.role = 'student' AND s.id IS NULL;

-- Create user settings for any users who don't have them
INSERT INTO user_settings (user_id)
SELECT u.id
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE us.id IS NULL;

-- Verify the data
SELECT 
  u.email,
  u.role,
  CASE WHEN s.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_student_profile,
  CASE WHEN us.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_settings
FROM users u
LEFT JOIN students s ON u.id = s.user_id
LEFT JOIN user_settings us ON u.id = us.user_id
ORDER BY u.created_at;
