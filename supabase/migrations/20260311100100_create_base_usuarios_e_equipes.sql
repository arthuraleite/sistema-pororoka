-- ENUMS
create type perfil_usuario as enum (
  'admin_supremo',
  'coordenador_geral',
  'gestor_financeiro',
  'coordenador_equipe',
  'assistente',
  'membro',
  'analista_financeiro'
);

create type status_usuario as enum (
  'ativo',
  'inativo'
);

-- TABELA DE EQUIPES
create table if not exists public.equipes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

-- TABELA DE USUÁRIOS
create table if not exists public.usuarios (
  id uuid primary key,
  email text not null unique,
  nome text not null,
  perfil perfil_usuario not null,
  equipe_id uuid references public.equipes(id) on delete set null,
  avatar_url text,
  status status_usuario not null default 'ativo',
  ultimo_login_em timestamptz,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

-- ÍNDICES
create index if not exists idx_usuarios_equipe_id on public.usuarios(equipe_id);
create index if not exists idx_usuarios_perfil on public.usuarios(perfil);
create index if not exists idx_usuarios_status on public.usuarios(status);

-- HABILITAR RLS
alter table public.equipes enable row level security;
alter table public.usuarios enable row level security;