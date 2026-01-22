-- Create demand_comments table
CREATE TABLE public.demand_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demand_comments ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone authenticated can view comments
CREATE POLICY "Authenticated users can view comments"
ON public.demand_comments
FOR SELECT
USING (true);

-- Users can create comments on their own demands
CREATE POLICY "Users can comment on own demands"
ON public.demand_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND (
    -- User is the demand creator
    EXISTS (
      SELECT 1 FROM public.demands 
      WHERE id = demand_id AND created_by = auth.uid()
    )
    OR
    -- User is a master
    has_role(auth.uid(), 'master')
  )
);

-- Masters can delete any comment
CREATE POLICY "Masters can delete comments"
ON public.demand_comments
FOR DELETE
USING (has_role(auth.uid(), 'master'));

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.demand_comments
FOR DELETE
USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_demand_comments_demand_id ON public.demand_comments(demand_id);
CREATE INDEX idx_demand_comments_created_at ON public.demand_comments(created_at DESC);