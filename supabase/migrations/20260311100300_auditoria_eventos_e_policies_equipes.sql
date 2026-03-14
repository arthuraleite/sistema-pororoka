-- =========================================================
-- AUDITORIA GENÉRICA
-- =========================================================

create table if not exists public.auditoria_eventos (
  id uuid primary key default gen_random_uuid(),
  ator_id uuid not null references public.usuarios(id) on delete restrict,
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  detalhes jsonb,
  data_evento timestamptz not null default now()
);

create index if not exists idx_auditoria_eventos_ator_id
  on public.auditoria_eventos(ator_id);

create index if not exists idx_auditoria_eventos_entidade
  on public.auditoria_eventos(entidade);

create index if not exists idx_auditoria_eventos_entidade_id
  on public.auditoria_eventos(entidade_id);

create index if not exists idx_auditoria_eventos_data_evento
  on public.auditoria_eventos(data_evento desc);

alter table public.auditoria_eventos enable row level security;

-- =========================================================
-- POLICIES DE AUDITORIA
-- =========================================================

create policy "configuradores_podem_ler_auditoria"
on public.auditoria_eventos
for select
to authenticated
using (
  exists (
    select 1
    from public.usuarios as u
    where u.id = auth.uid()
      and u.status = 'ativo'
      and u.perfil in ('admin_supremo', 'coordenador_geral')
  )
);

create policy "configuradores_podem_inserir_auditoria"
on public.auditoria_eventos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.usuarios as u
    where u.id = auth.uid()
      and u.status = 'ativo'
      and u.perfil in ('admin_supremo', 'coordenador_geral')
  )
);

-- =========================================================
-- POLICIES DE ESCRITA EM EQUIPES
-- =========================================================

create policy "admins_supremos_podem_inserir_equipes"
on public.equipes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.usuarios as u
    where u.id = auth.uid()
      and u.status = 'ativo'
      and u.perfil = 'admin_supremo'
  )
);

create policy "admins_supremos_podem_atualizar_equipes"
on public.equipes
for update
to authenticated
using (
  exists (
    select 1
    from public.usuarios as u
    where u.id = auth.uid()
      and u.status = 'ativo'
      and u.perfil = 'admin_supremo'
  )
)
with check (
  exists (
    select 1
    from public.usuarios as u
    where u.id = auth.uid()
      and u.status = 'ativo'
      and u.perfil = 'admin_supremo'
  )
);