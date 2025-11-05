-- Add soft delete column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS deleted_by_user1 boolean default false,
ADD COLUMN IF NOT EXISTS deleted_by_user2 boolean default false;

-- Update fetchUserConversations query logic to exclude soft-deleted conversations
-- This will be handled in the queries.ts file
