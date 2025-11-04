-- Create users table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  profile_picture_url text,
  theme_preference text default 'light',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.users enable row level security;

create policy "Users can view any user profile"
  on public.users for select
  using (true);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Create conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.users(id) on delete cascade,
  user2_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint user_order check (user1_id < user2_id),
  constraint unique_conversation unique(user1_id, user2_id)
);

alter table public.conversations enable row level security;

create policy "Users can view their conversations"
  on public.conversations for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  message_type text default 'text',
  content text not null,
  file_url text,
  read_status boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.messages enable row level security;

create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "Users can insert messages in their conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
  );

create policy "Users can update read status"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- Create indexes for performance
create index if not exists idx_conversations_user1 on public.conversations(user1_id);
create index if not exists idx_conversations_user2 on public.conversations(user2_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);
create index if not exists idx_users_username on public.users(username);
