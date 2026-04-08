begin;

-- =========================================================
-- 1. TABELA DE FINANCIADORES
-- =========================================================

create table if not exists public.financiadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint chk_financiadores_nome_nao_vazio
    check (btrim(nome) <> '')
);

create unique index if not exists uq_financiadores_nome_normalizado
  on public.financiadores (public.normalizar_texto_busca(nome));

create index if not exists idx_financiadores_data_criacao
  on public.financiadores (data_criacao desc);

alter table public.financiadores enable row level security;

-- =========================================================
-- 2. BACKFILL DOS FINANCIADORES ANTIGOS
-- =========================================================

insert into public.financiadores (nome)
select min(btrim(p.financiador)) as nome
from public.projetos p
where p.financiador is not null
  and btrim(p.financiador) <> ''
group by public.normalizar_texto_busca(p.financiador)
on conflict do nothing;

-- =========================================================
-- 3. AJUSTE ESTRUTURAL EM PROJETOS
-- =========================================================

alter table public.projetos
  drop constraint if exists chk_projetos_regras_tipo;

alter table public.projetos
  add column if not exists financiador_id uuid null;

update public.projetos p
set financiador_id = f.id
from public.financiadores f
where p.financiador is not null
  and btrim(p.financiador) <> ''
  and public.normalizar_texto_busca(p.financiador) = public.normalizar_texto_busca(f.nome)
  and p.financiador_id is null;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'projetos'
      and constraint_name = 'fk_projetos_financiador'
  ) then
    alter table public.projetos
      add constraint fk_projetos_financiador
      foreign key (financiador_id)
      references public.financiadores(id)
      on delete restrict;
  end if;
end $$;

create index if not exists idx_projetos_financiador_id
  on public.projetos (financiador_id);

alter table public.projetos
  drop column if exists financiador;

alter table public.projetos
  add constraint chk_projetos_regras_tipo
  check (
    (
      tipo = 'interno'
      and financiador_id is null
      and orcamento_total is null
    )
    or
    (
      tipo = 'financiado'
      and financiador_id is not null
      and orcamento_total is not null
      and orcamento_total > 0
    )
  );

-- =========================================================
-- 4. FUNÇÕES DE ACESSO / PERMISSÃO
-- =========================================================

create or replace function public.fn_pode_acessar_modulo_projetos()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and u.status = 'ativo'
      and (
        u.perfil in ('admin_supremo', 'coordenador_geral', 'gestor_financeiro')
        or exists (
          select 1
          from public.projetos p
          where p.coordenador_id = u.id
        )
      )
  )
$$;

create or replace function public.fn_pode_gerir_financiador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and u.status = 'ativo'
      and u.perfil in ('admin_supremo', 'coordenador_geral', 'gestor_financeiro')
  )
$$;

create or replace function public.fn_pode_gerir_rubrica_global()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and u.status = 'ativo'
      and u.perfil in ('admin_supremo', 'coordenador_geral', 'gestor_financeiro')
  )
$$;

create or replace function public.fn_pode_ver_projeto(p_projeto_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projetos p
    join public.usuarios u on u.id = auth.uid()
    where p.id = p_projeto_id
      and u.status = 'ativo'
      and (
        u.perfil in ('admin_supremo', 'coordenador_geral', 'gestor_financeiro')
        or p.coordenador_id = u.id
      )
  )
$$;

create or replace function public.fn_pode_editar_projeto(p_projeto_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projetos p
    join public.usuarios u on u.id = auth.uid()
    where p.id = p_projeto_id
      and u.status = 'ativo'
      and (
        u.perfil in ('admin_supremo', 'coordenador_geral')
        or p.coordenador_id = u.id
      )
  )
$$;

-- =========================================================
-- 5. POLICIES DE FINANCIADORES
-- =========================================================

drop policy if exists "financiadores_select" on public.financiadores;
drop policy if exists "financiadores_insert" on public.financiadores;
drop policy if exists "financiadores_update" on public.financiadores;
drop policy if exists "financiadores_delete" on public.financiadores;

create policy "financiadores_select"
on public.financiadores
for select
to authenticated
using (public.fn_pode_acessar_modulo_projetos());

create policy "financiadores_insert"
on public.financiadores
for insert
to authenticated
with check (public.fn_pode_gerir_financiador());

create policy "financiadores_update"
on public.financiadores
for update
to authenticated
using (public.fn_pode_gerir_financiador())
with check (public.fn_pode_gerir_financiador());

create policy "financiadores_delete"
on public.financiadores
for delete
to authenticated
using (false);

-- =========================================================
-- 6. TRIGGER DE data_atualizacao
-- =========================================================

drop trigger if exists trg_financiadores_data_atualizacao on public.financiadores;

create trigger trg_financiadores_data_atualizacao
before update on public.financiadores
for each row
execute function public.definir_data_atualizacao();

commit;