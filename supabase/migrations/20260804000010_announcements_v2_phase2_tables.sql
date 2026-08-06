-- ==============================================================================
-- PHASE 2: ANNOUNCEMENTS V2 SCHEMA UPGRADE - TABLES
-- ==============================================================================

DO $$
BEGIN

  -- ==============================================================================
  -- 1. Create announcement_targets
  -- ==============================================================================
  CREATE TABLE IF NOT EXISTS public.announcement_targets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id uuid NOT NULL,
    target_type text NOT NULL,
    target_reference_id text,
    created_by uuid,
    created_at timestamptz DEFAULT now()
  );

  -- ==============================================================================
  -- 2. Create announcement_reads
  -- ==============================================================================
  CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id uuid NOT NULL,
    intern_id uuid NOT NULL,
    read_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- ==============================================================================
  -- 3. Create announcement_attachments
  -- ==============================================================================
  CREATE TABLE IF NOT EXISTS public.announcement_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id uuid NOT NULL,
    attachment_type text NOT NULL,
    storage_path text NOT NULL,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    file_size bigint NOT NULL,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
  );

  -- ==============================================================================
  -- 4. Create announcement_audit_logs
  -- ==============================================================================
  CREATE TABLE IF NOT EXISTS public.announcement_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id uuid NOT NULL,
    actor_id uuid,
    action text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
  );


  -- ==============================================================================
  -- 5 & 6. Foreign Keys & Unique Constraints
  -- ==============================================================================

  -- announcement_targets
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_targets_announcement_id_fkey') THEN
    ALTER TABLE public.announcement_targets ADD CONSTRAINT announcement_targets_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_targets_created_by_fkey' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')) THEN
    ALTER TABLE public.announcement_targets ADD CONSTRAINT announcement_targets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_targets_type_check') THEN
    ALTER TABLE public.announcement_targets ADD CONSTRAINT announcement_targets_type_check CHECK (target_type IN ('all_interns', 'problem_statement', 'college', 'city', 'batch', 'selected_intern'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_targets_unique_target') THEN
    ALTER TABLE public.announcement_targets ADD CONSTRAINT announcement_targets_unique_target UNIQUE (announcement_id, target_type, target_reference_id);
  END IF;


  -- announcement_reads
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_reads_announcement_id_fkey') THEN
    ALTER TABLE public.announcement_reads ADD CONSTRAINT announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_reads_intern_id_fkey' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')) THEN
    ALTER TABLE public.announcement_reads ADD CONSTRAINT announcement_reads_intern_id_fkey FOREIGN KEY (intern_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_reads_unique') THEN
    ALTER TABLE public.announcement_reads ADD CONSTRAINT announcement_reads_unique UNIQUE (announcement_id, intern_id);
  END IF;


  -- announcement_attachments
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_attachments_announcement_id_fkey') THEN
    ALTER TABLE public.announcement_attachments ADD CONSTRAINT announcement_attachments_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_attachments_storage_path_key') THEN
    ALTER TABLE public.announcement_attachments ADD CONSTRAINT announcement_attachments_storage_path_key UNIQUE (storage_path);
  END IF;


  -- announcement_audit_logs
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_audit_logs_announcement_id_fkey') THEN
    ALTER TABLE public.announcement_audit_logs ADD CONSTRAINT announcement_audit_logs_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;
  END IF;


  -- ==============================================================================
  -- 7. Indexes
  -- ==============================================================================
  
  -- targets
  CREATE UNIQUE INDEX IF NOT EXISTS uq_announcement_targets_global
  ON public.announcement_targets (announcement_id, target_type)
  WHERE target_reference_id IS NULL;

  CREATE UNIQUE INDEX IF NOT EXISTS uq_announcement_targets_scoped
  ON public.announcement_targets (announcement_id, target_type, target_reference_id)
  WHERE target_reference_id IS NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcement_targets_announcement_id') THEN
    CREATE INDEX idx_announcement_targets_announcement_id ON public.announcement_targets(announcement_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcement_targets_type') THEN
    CREATE INDEX idx_announcement_targets_type ON public.announcement_targets(target_type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcement_targets_ref') THEN
    CREATE INDEX idx_announcement_targets_ref ON public.announcement_targets(target_reference_id);
  END IF;

  -- reads
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcement_reads_intern_id') THEN
    CREATE INDEX idx_announcement_reads_intern_id ON public.announcement_reads(intern_id);
  END IF;
  
  -- attachments
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcement_attachments_announcement_id') THEN
    CREATE INDEX idx_announcement_attachments_announcement_id ON public.announcement_attachments(announcement_id);
  END IF;


  -- ==============================================================================
  -- 8. Enable RLS
  -- ==============================================================================
  ALTER TABLE public.announcement_targets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.announcement_attachments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.announcement_audit_logs ENABLE ROW LEVEL SECURITY;

END $$;

-- ==============================================================================
-- 9 & 10. Migrate legacy targets
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'visibility') THEN
    EXECUTE $dyn$
      INSERT INTO public.announcement_targets (
        announcement_id,
        target_type,
        target_reference_id
      )
      SELECT
        a.id,
        'all_interns',
        NULL
      FROM public.announcements a
      WHERE a.visibility::text = 'all'
        AND a.problem_statement_id IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.announcement_targets at
          WHERE at.announcement_id = a.id
            AND at.target_type = 'all_interns'
            AND at.target_reference_id IS NULL
        );
    $dyn$;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'problem_statement_id') THEN
    EXECUTE $dyn$
      INSERT INTO public.announcement_targets (
        announcement_id,
        target_type,
        target_reference_id
      )
      SELECT
        a.id,
        'problem_statement',
        a.problem_statement_id::text
      FROM public.announcements a
      WHERE a.problem_statement_id IS NOT NULL
      ON CONFLICT ON CONSTRAINT announcement_targets_unique_target
      DO NOTHING;
    $dyn$;
  END IF;
END $$;

-- NOTIFY PostgREST
NOTIFY pgrst, 'reload schema';
