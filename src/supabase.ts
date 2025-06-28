import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kgkefzggprbqiexonnkr.supabase.co'  // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtna2VmemdncHJicWlleG9ubmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MDkwMjksImV4cCI6MjA2NjQ4NTAyOX0.0HTLMpcErDEwYlIzmdeTs8rQVKcOZmbYyu9uvbm7KMc'               // Replace with your Supabase anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
