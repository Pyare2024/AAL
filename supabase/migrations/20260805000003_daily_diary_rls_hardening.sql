-- ==============================================================================
-- MIGRATION: Harden Daily Diary RLS to Enforce Date Locking at Table Level
-- Description: Ensures that direct API access cannot bypass the RPC date locks.
--              Interns can only insert, update, or delete rows where entry_date
--              is exactly today in Asia/Kolkata timezone.
-- ==============================================================================

-- Drop existing generic policies if they exist (except super admin)
DO $$ 
BEGIN
  -- We assume standard policies might be named like "Interns manage own daily_diary_entries"
  -- We will recreate them to be strictly date-locked.
  DROP POLICY IF EXISTS "Interns manage own daily_diary_entries" ON public.daily_diary_entries;
  DROP POLICY IF EXISTS "Interns can read own diary" ON public.daily_diary_entries;
  DROP POLICY IF EXISTS "Interns can insert own diary" ON public.daily_diary_entries;
  DROP POLICY IF EXISTS "Interns can update own diary" ON public.daily_diary_entries;
  DROP POLICY IF EXISTS "Interns can delete own diary" ON public.daily_diary_entries;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- 1. Read Policy: Interns can read their own diary history (any date)
CREATE POLICY "Interns can read own diary"
  ON public.daily_diary_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = intern_id);

-- 2. Insert Policy: Interns can ONLY insert for today (Asia/Kolkata)
CREATE POLICY "Interns can insert own diary"
  ON public.daily_diary_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = intern_id 
    AND entry_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
  );

-- 3. Update Policy: Interns can ONLY update if the entry_date is today
CREATE POLICY "Interns can update own diary"
  ON public.daily_diary_entries
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = intern_id 
    AND entry_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
  )
  WITH CHECK (
    auth.uid() = intern_id 
    AND entry_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
  );

-- 4. Delete Policy: Interns can ONLY delete if the entry_date is today
CREATE POLICY "Interns can delete own diary"
  ON public.daily_diary_entries
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = intern_id 
    AND entry_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
  );
