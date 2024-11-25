import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dyunvocxssjwavliqjsl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dW52b2N4c3Nqd2F2bGlxanNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MTQxMjgsImV4cCI6MjA0ODA5MDEyOH0.22_2YTGbtoL8ShioAmQZ00ELx8fknGKThDkaGo-CZJc';

export const supabase = createClient(supabaseUrl, supabaseKey);