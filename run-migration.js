const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMissingColumns() {
  try {
    console.log('🔄 Testing assessments table structure...')
    
    // Check if there are any students first
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .limit(1)
    
    if (studentsError) {
      console.error('❌ Cannot access students table:', studentsError)
      return
    }
    
    console.log('Students found:', students?.length || 0)
    
    // Test if we can make a simple query to assessments table
    const { data: testData, error: testError } = await supabase
      .from('assessments')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Cannot access assessments table:', testError)
      return
    } else {
      console.log('✅ Successfully connected to assessments table')
      if (testData && testData.length > 0) {
        console.log('Sample record columns:', Object.keys(testData[0]))
      }
    }
    
    // Try with a minimal realistic record (if we have students)
    if (students && students.length > 0) {
      console.log('\n🧪 Testing realistic assessment submission...')
      
      const testRecord = {
        student_id: students[0].id,
        responses: { 
          stress_level: 'moderate_stress',
          anxiety_frequency: 'several_days',
          mood_changes: 'minor_changes',
          sleep_quality: 'good',
          academic_pressure: 'moderate_pressure',
          social_connections: 'satisfied'
        },
        risk_level: 'low'
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('assessments')
        .insert(testRecord)
        .select()
      
      if (insertError) {
        console.log('❌ Realistic insert failed:', insertError.message)
      } else {
        console.log('✅ Realistic insert succeeded! Assessment ID:', insertData[0].id)
        console.log('Assessment data:', insertData[0])
        // Clean up the test record
        await supabase.from('assessments').delete().eq('id', insertData[0].id)
        console.log('✅ Test record cleaned up')
      }
    } else {
      console.log('⚠️ No students found, cannot test realistic assessment submission')
    }
    
    console.log('\n✅ Assessment table structure test completed!')
    
  } catch (error) {
    console.error('❌ Error testing table structure:', error)
    process.exit(1)
  }
}

addMissingColumns()
