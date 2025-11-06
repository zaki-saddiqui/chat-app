-- Making sure the soft delete columns exist and are properly indexed
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS deleted_by_user1 boolean default false,
ADD COLUMN IF NOT EXISTS deleted_by_user2 boolean default false;

-- Add index for faster queries filtering by deleted status
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_user1 ON public.conversations(user1_id, deleted_by_user1);
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_user2 ON public.conversations(user2_id, deleted_by_user2);
