CREATE TABLE IF NOT EXISTS public.community_post_likes (
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read likes for posts they can see"
    ON public.community_post_likes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.community_posts
            WHERE id = community_post_likes.post_id
        )
    );

CREATE POLICY "Users can insert their own likes"
    ON public.community_post_likes
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.community_posts
            WHERE id = post_id
        )
    );

CREATE POLICY "Users can delete their own likes"
    ON public.community_post_likes
    FOR DELETE
    USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
