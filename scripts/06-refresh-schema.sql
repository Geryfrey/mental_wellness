-- Refresh the schema cache by updating table statistics
ANALYZE students;
ANALYZE assessments;
ANALYZE users;

-- Verify the registration_number column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Verify the new assessment columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
ORDER BY ordinal_position;
