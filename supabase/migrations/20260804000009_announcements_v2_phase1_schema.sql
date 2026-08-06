-- ==============================================================================
-- PHASE 1: ANNOUNCEMENTS V2 SCHEMA UPGRADE
-- ==============================================================================

DO $$
BEGIN
  -- ==============================================================================
  -- STEP 1 — VERIFY AND NORMALIZE COLUMN TYPES
  -- ==============================================================================
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS summary text;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS category text;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority text;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS status text;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_pinned boolean;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS author_id uuid;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS published_at timestamptz;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS archived_at timestamptz;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS tags text[];


  -- ==============================================================================
  -- STEP 3 — MIGRATE LEGACY DATA (Before Setting NOT NULL to avoid errors)
  -- ==============================================================================
  
  -- Migrate created_by to author_id if applicable
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.announcements SET author_id = created_by::uuid WHERE author_id IS NULL AND created_by IS NOT NULL';
  END IF;

  -- Migrate is_active to status and published_at
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_active') THEN
    EXECUTE '
      UPDATE public.announcements 
      SET status = ''published'', 
          published_at = COALESCE(published_at, created_at) 
      WHERE is_active = true AND (status IS NULL OR status = ''draft'')';
      
    EXECUTE '
      UPDATE public.announcements 
      SET status = ''draft'' 
      WHERE (is_active = false OR is_active IS NULL) AND status IS NULL';
  END IF;

  -- Generate summary from content if missing
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'content') THEN
    EXECUTE 'UPDATE public.announcements SET summary = LEFT(content, 240) WHERE (summary IS NULL OR summary = '''') AND content IS NOT NULL';
  END IF;


  -- ==============================================================================
  -- STEP 2 — DEFAULT VALUES & NOT NULL
  -- ==============================================================================
  
  -- Normalize NULLs before applying defaults
  UPDATE public.announcements SET priority = 'normal' WHERE priority IS NULL;
  UPDATE public.announcements SET status = 'draft' WHERE status IS NULL;
  UPDATE public.announcements SET is_pinned = false WHERE is_pinned IS NULL;
  UPDATE public.announcements SET tags = '{}' WHERE tags IS NULL;

  ALTER TABLE public.announcements ALTER COLUMN priority SET DEFAULT 'normal';
  ALTER TABLE public.announcements ALTER COLUMN status SET DEFAULT 'draft';
  ALTER TABLE public.announcements ALTER COLUMN is_pinned SET DEFAULT false;
  ALTER TABLE public.announcements ALTER COLUMN tags SET DEFAULT '{}';

  ALTER TABLE public.announcements ALTER COLUMN priority SET NOT NULL;
  ALTER TABLE public.announcements ALTER COLUMN status SET NOT NULL;
  ALTER TABLE public.announcements ALTER COLUMN is_pinned SET NOT NULL;
  ALTER TABLE public.announcements ALTER COLUMN tags SET NOT NULL;


  -- ==============================================================================
  -- STEP 4 — STATUS AND PRIORITY CONSTRAINTS
  -- ==============================================================================
  
  -- Normalize invalid values
  UPDATE public.announcements SET priority = 'normal' WHERE priority NOT IN ('normal','important','urgent');
  UPDATE public.announcements SET status = 'draft' WHERE status NOT IN ('draft','scheduled','published','expired','archived');

  ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_priority_check;
  ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_status_check;

  ALTER TABLE public.announcements ADD CONSTRAINT announcements_priority_check CHECK (priority IN ('normal','important','urgent'));
  ALTER TABLE public.announcements ADD CONSTRAINT announcements_status_check CHECK (status IN ('draft','scheduled','published','expired','archived'));


  -- ==============================================================================
  -- STEP 5 — AUTHOR FOREIGN KEY
  -- ==============================================================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Clean orphans
    UPDATE public.announcements 
    SET author_id = NULL 
    WHERE author_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = public.announcements.author_id);
    
    -- Drop existing FK if exists to prevent duplicates
    ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_author_id_fkey;
    
    -- Add safe FK
    ALTER TABLE public.announcements 
    ADD CONSTRAINT announcements_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;


  -- ==============================================================================
  -- STEP 6 — INDEXES
  -- ==============================================================================
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_status') THEN
    CREATE INDEX idx_announcements_status ON public.announcements(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_priority') THEN
    CREATE INDEX idx_announcements_priority ON public.announcements(priority);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_author_id') THEN
    CREATE INDEX idx_announcements_author_id ON public.announcements(author_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_published_at') THEN
    CREATE INDEX idx_announcements_published_at ON public.announcements(published_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_scheduled_at') THEN
    CREATE INDEX idx_announcements_scheduled_at ON public.announcements(scheduled_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_deleted_at') THEN
    CREATE INDEX idx_announcements_deleted_at ON public.announcements(deleted_at);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_is_pinned') THEN
    CREATE INDEX idx_announcements_is_pinned ON public.announcements(is_pinned);
  END IF;

END $$;

-- ==============================================================================
-- STEP 7 — UPDATED_AT TRIGGER
-- ==============================================================================

-- Create reusable function if missing
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply safely
DROP TRIGGER IF EXISTS trg_announcements_set_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_set_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- RELOAD SCHEMA
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
