import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://teksvqzoekypmczuhzmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRla3N2cXpvZWt5cG1jenVoem15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjMyODUsImV4cCI6MjA3Njc5OTI4NX0.6e17_EdhsizbyZXaOB0ixoWadfUK0WhMk-PKaIrZnAo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
