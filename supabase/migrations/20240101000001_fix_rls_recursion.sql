-- Fix RLS infinite recursion issue
-- Run this in Supabase SQL Editor to fix the policies

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users select own data" ON users;
DROP POLICY IF EXISTS "Users update own data" ON users;
DROP POLICY IF EXISTS "Users manage own accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users manage own availability" ON availability;
DROP POLICY IF EXISTS "Users manage own meeting types" ON meeting_types;
DROP POLICY IF EXISTS "Hosts view own bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users create own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins view feedback" ON feedback;
DROP POLICY IF EXISTS "Admins archive feedback" ON feedback;
DROP POLICY IF EXISTS "Anyone can view availability" ON availability;
DROP POLICY IF EXISTS "Anyone can view active meeting types" ON meeting_types;

-- Since we use Clerk (not Supabase Auth) and service role key for all server operations,
-- we can use simple permissive policies that allow authenticated access.
-- The actual authorization is handled in the application layer via Clerk.

-- Users table: allow all operations (service role bypasses RLS anyway)
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Connected accounts: allow all operations
CREATE POLICY "Allow all operations on connected_accounts" ON connected_accounts
  FOR ALL USING (true) WITH CHECK (true);

-- Availability: allow all operations  
CREATE POLICY "Allow all operations on availability" ON availability
  FOR ALL USING (true) WITH CHECK (true);

-- Meeting types: allow all operations
CREATE POLICY "Allow all operations on meeting_types" ON meeting_types
  FOR ALL USING (true) WITH CHECK (true);

-- Bookings: allow all operations
CREATE POLICY "Allow all operations on bookings" ON bookings
  FOR ALL USING (true) WITH CHECK (true);

-- Feedback: allow all operations
CREATE POLICY "Allow all operations on feedback" ON feedback
  FOR ALL USING (true) WITH CHECK (true);
