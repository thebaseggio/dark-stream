import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://baqvszumalgtgaepxwqq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcXZzenVtYWxndGdhZXB4d3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0OTc5MDUsImV4cCI6MjA2NTA3MzkwNX0.yWxkwYEovZnSQdQ1gdTpdsuA9rivWnnYEOnHfY1bsR8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)