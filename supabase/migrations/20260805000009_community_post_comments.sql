CREATE TABLE IF NOT EXISTS public.community_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read comments for posts they can see"
    ON public.community_post_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.community_posts
            WHERE id = community_post_comments.post_id
        )
    );

CREATE POLICY "Users can insert their own comments"
    ON public.community_post_comments
    FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.community_posts
            WHERE id = post_id
        )
    );

CREATE POLICY "Users can update their own comments"
    ON public.community_post_comments
    FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
    ON public.community_post_comments
    FOR DELETE
    USING (author_id = auth.uid());

CREATE OR REPLACE FUNCTION update_community_post_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_community_post_comments_updated_at ON public.community_post_comments;
CREATE TRIGGER trg_community_post_comments_updated_at
BEFORE UPDATE ON public.community_post_comments
FOR EACH ROW
EXECUTE FUNCTION update_community_post_comments_updated_at();

NOTIFY pgrst, 'reload schema';
