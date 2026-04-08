begin;

create extension if not exists unaccent;

-- =========================================================
-- ENUMS DO MÓDULO DE PROJETOS
-- =========================================================

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'tipo_projeto'
      and n.nspname = 'public'
  ) then
    create type public.tipo_projeto as enum ('financiado', 'interno');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'status_projeto'
      and n.nspname = 'public'
  ) then
    create type public.status_projeto as enum (
      'a_iniciar',
      'em_andamento',
      'finalizado',
      'concluido'
    );
  end if;
end $$;

-- =========================================================
-- TABELAS DO MÓDULO DE PROJETOS
-- =========================================================

create table if not exists public.rubricas_globais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text null,
  ativa boolean not null default true,
  criado_por_id uuid null,
  atualizado_por_id uuid null,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_rubricas_globais_criado_por'
  ) then
    alter table public.rubricas_globais
      add constraint fk_rubricas_globais_criado_por
      foreign key (criado_por_id)
      references public.usuarios(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_rubricas_globais_atualizado_por'
  ) then
    alter table public.rubricas_globais
      add constraint fk_rubricas_globais_atualizado_por
      foreign key (atualizado_por_id)
      references public.usuarios(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_rubricas_globais_nome_nao_vazio'
  ) then
    alter table public.rubricas_globais
      add constraint chk_rubricas_globais_nome_nao_vazio
      check (btrim(nome) <> '');
  end if;
end $$;

create or replace function public.normalizar_texto_busca(valor text)
returns text
language sql
immutable
as $$
  select lower(public.unaccent(coalesce(btrim(valor), '')))
$$;

create unique index uq_rubricas_globais_nome_ativo_normalizado
  on public.rubricas_globais (public.normalizar_texto_busca(nome))
  where ativa = true;

create index if not exists idx_rubricas_globais_ativa
  on public.rubricas_globais (ativa);

create index if not exists idx_rubricas_globais_data_criacao
  on public.rubricas_globais (data_criacao desc);

create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_projeto not null default 'financiado',
  nome text not null,
  sigla text not null,
  resumo text null,
  financiador text null,
  data_inicio date not null,
  data_fim date null,
  orcamento_total numeric(14,2) null,
  status public.status_projeto not null default 'a_iniciar',
  coordenador_id uuid not null,
  observacoes text null,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_projetos_coordenador'
  ) then
    alter table public.projetos
      add constraint fk_projetos_coordenador
      foreign key (coordenador_id)
      references public.usuarios(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'uq_projetos_sigla'
  ) then
    alter table public.projetos
      add constraint uq_projetos_sigla
      unique (sigla);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_projetos_nome_nao_vazio'
  ) then
    alter table public.projetos
      add constraint chk_projetos_nome_nao_vazio
      check (btrim(nome) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_projetos_sigla_nao_vazia'
  ) then
    alter table public.projetos
      add constraint chk_projetos_sigla_nao_vazia
      check (btrim(sigla) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_projetos_data_fim_maior_ou_igual_inicio'
  ) then
    alter table public.projetos
      add constraint chk_projetos_data_fim_maior_ou_igual_inicio
      check (data_fim is null or data_fim >= data_inicio);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_projetos_regras_tipo'
  ) then
    alter table public.projetos
      add constraint chk_projetos_regras_tipo
      check (
        (
          tipo = 'interno'
          and financiador is null
          and orcamento_total is null
        )
        or
        (
          tipo = 'financiado'
          and financiador is not null
          and btrim(financiador) <> ''
          and orcamento_total is not null
          and orcamento_total > 0
        )
      );
  end if;
end $$;

create index if not exists idx_projetos_tipo
  on public.projetos (tipo);

create index if not exists idx_projetos_status
  on public.projetos (status);

create index if not exists idx_projetos_coordenador_id
  on public.projetos (coordenador_id);

create index if not exists idx_projetos_data_inicio
  on public.projetos (data_inicio);

create index if not exists idx_projetos_data_criacao
  on public.projetos (data_criacao desc);

create table if not exists public.projeto_links (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null,
  titulo text not null,
  url text not null,
  ordem integer not null default 1,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_projeto_links_projeto'
  ) then
    alter table public.projeto_links
      add constraint fk_projeto_links_projeto
      foreign key (projeto_id)
      references public.projetos(id)
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_projeto_links_titulo_nao_vazio'
  ) then
    alter table public.projeto_links
      add constraint chk_projeto_links_titulo_nao_vazio
      check (btrim(titulo) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_projeto_links_url_nao_vazia'
  ) then
    alter table public.projeto_links
      add constraint chk_projeto_links_url_nao_vazia
      check (btrim(url) <> '');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_projeto_links_ordem_positiva'
  ) then
    alter table public.projeto_links
      add constraint chk_projeto_links_ordem_positiva
      check (ordem > 0);
  end if;
end $$;

create index if not exists idx_projeto_links_projeto_id
  on public.projeto_links (projeto_id);

create index if not exists idx_projeto_links_projeto_ordem
  on public.projeto_links (projeto_id, ordem);

create table if not exists public.rubricas_projeto (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null,
  rubrica_global_id uuid not null,
  limite_teto_gasto numeric(14,2) not null,
  ativa boolean not null default true,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_rubricas_projeto_projeto'
  ) then
    alter table public.rubricas_projeto
      add constraint fk_rubricas_projeto_projeto
      foreign key (projeto_id)
      references public.projetos(id)
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_rubricas_projeto_rubrica_global'
  ) then
    alter table public.rubricas_projeto
      add constraint fk_rubricas_projeto_rubrica_global
      foreign key (rubrica_global_id)
      references public.rubricas_globais(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'uq_rubricas_projeto_projeto_rubrica'
  ) then
    alter table public.rubricas_projeto
      add constraint uq_rubricas_projeto_projeto_rubrica
      unique (projeto_id, rubrica_global_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_rubricas_projeto_limite_nao_negativo'
  ) then
    alter table public.rubricas_projeto
      add constraint chk_rubricas_projeto_limite_nao_negativo
      check (limite_teto_gasto >= 0);
  end if;
end $$;

create index if not exists idx_rubricas_projeto_projeto_id
  on public.rubricas_projeto (projeto_id);

create index if not exists idx_rubricas_projeto_rubrica_global_id
  on public.rubricas_projeto (rubrica_global_id);

create index if not exists idx_rubricas_projeto_ativa
  on public.rubricas_projeto (ativa);

-- =========================================================
-- FK DE TAREFAS -> PROJETOS
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_tarefas_projeto'
  ) then
    alter table public.tarefas
      add constraint fk_tarefas_projeto
      foreign key (projeto_id)
      references public.projetos(id)
      on delete set null;
  end if;
end $$;

-- =========================================================
-- FUNÇÕES AUXILIARES DO MÓDULO DE PROJETOS
-- =========================================================

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
        u.perfil in ('admin_supremo', 'coordenador_geral')
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

create or replace function public.projetos_impedir_troca_coordenador_sem_permissao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfil_usuario;
begin
  if old.coordenador_id is distinct from new.coordenador_id then
    select u.perfil
      into v_perfil
      from public.usuarios u
     where u.id = auth.uid()
       and u.status = 'ativo'
     limit 1;

    if v_perfil is null or v_perfil not in ('admin_supremo', 'coordenador_geral') then
      raise exception 'Apenas admin_supremo e coordenador_geral podem alterar o coordenador do projeto.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.projetos_validar_alteracao_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfil_usuario;
begin
  if old.status is distinct from new.status then
    select u.perfil
      into v_perfil
      from public.usuarios u
     where u.id = auth.uid()
       and u.status = 'ativo'
     limit 1;

    if v_perfil is null then
      raise exception 'Usuário atual não encontrado.'
        using errcode = 'P0001';
    end if;

    if v_perfil not in ('admin_supremo', 'coordenador_geral')
       and old.coordenador_id <> auth.uid() then
      raise exception 'Apenas admin_supremo, coordenador_geral e o coordenador do projeto podem alterar o status.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.projeto_links_limitar_maximo_dez()
returns trigger
language plpgsql
as $$
declare
  v_total integer;
begin
  select count(*)
    into v_total
    from public.projeto_links
   where projeto_id = new.projeto_id;

  if tg_op = 'UPDATE' then
    return new;
  end if;

  if v_total >= 10 then
    raise exception 'O projeto pode ter no máximo 10 links.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.projetos_validar_rubricas_financiamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_projeto_id uuid;
  v_tipo public.tipo_projeto;
  v_orcamento_total numeric(14,2);
  v_total_rubricas numeric(14,2);
  v_qtd_rubricas integer;
begin
  v_projeto_id := coalesce(new.projeto_id, old.projeto_id, new.id, old.id);

  if v_projeto_id is null then
    return coalesce(new, old);
  end if;

  select p.tipo, p.orcamento_total
    into v_tipo, v_orcamento_total
    from public.projetos p
   where p.id = v_projeto_id;

  if not found then
    return coalesce(new, old);
  end if;

  if v_tipo = 'interno' then
    return coalesce(new, old);
  end if;

  select count(*), coalesce(sum(rp.limite_teto_gasto), 0)
    into v_qtd_rubricas, v_total_rubricas
    from public.rubricas_projeto rp
   where rp.projeto_id = v_projeto_id
     and rp.ativa = true;

  if v_qtd_rubricas = 0 then
    raise exception 'Todo projeto financiado deve ter ao menos uma rubrica.'
      using errcode = '23514';
  end if;

  if v_total_rubricas <> v_orcamento_total then
    raise exception 'A soma dos tetos das rubricas deve ser exatamente igual ao orçamento total do projeto.'
      using errcode = '23514';
  end if;

  return coalesce(new, old);
end;
$$;

-- =========================================================
-- RLS
-- =========================================================

alter table public.rubricas_globais enable row level security;
alter table public.projetos enable row level security;
alter table public.projeto_links enable row level security;
alter table public.rubricas_projeto enable row level security;

-- =========================================================
-- POLICIES - PROJETOS E RUBRICAS
-- =========================================================

drop policy if exists "rubricas_globais_select" on public.rubricas_globais;
create policy "rubricas_globais_select"
on public.rubricas_globais
for select
to authenticated
using (public.fn_usuario_ativo());

drop policy if exists "rubricas_globais_insert" on public.rubricas_globais;
create policy "rubricas_globais_insert"
on public.rubricas_globais
for insert
to authenticated
with check (public.fn_pode_gerir_rubrica_global());

drop policy if exists "rubricas_globais_update" on public.rubricas_globais;
create policy "rubricas_globais_update"
on public.rubricas_globais
for update
to authenticated
using (public.fn_pode_gerir_rubrica_global())
with check (public.fn_pode_gerir_rubrica_global());

drop policy if exists "rubricas_globais_delete" on public.rubricas_globais;
create policy "rubricas_globais_delete"
on public.rubricas_globais
for delete
to authenticated
using (false);

drop policy if exists "projetos_select" on public.projetos;
create policy "projetos_select"
on public.projetos
for select
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_ver_projeto(id)
);

drop policy if exists "projetos_insert" on public.projetos;
create policy "projetos_insert"
on public.projetos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and u.status = 'ativo'
      and u.perfil in ('admin_supremo', 'coordenador_geral')
  )
);

drop policy if exists "projetos_update" on public.projetos;
create policy "projetos_update"
on public.projetos
for update
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(id)
)
with check (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(id)
);

drop policy if exists "projetos_delete" on public.projetos;
create policy "projetos_delete"
on public.projetos
for delete
to authenticated
using (false);

drop policy if exists "projeto_links_select" on public.projeto_links;
create policy "projeto_links_select"
on public.projeto_links
for select
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_ver_projeto(projeto_id)
);

drop policy if exists "projeto_links_insert" on public.projeto_links;
create policy "projeto_links_insert"
on public.projeto_links
for insert
to authenticated
with check (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
);

drop policy if exists "projeto_links_update" on public.projeto_links;
create policy "projeto_links_update"
on public.projeto_links
for update
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
)
with check (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
);

drop policy if exists "projeto_links_delete" on public.projeto_links;
create policy "projeto_links_delete"
on public.projeto_links
for delete
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
);

drop policy if exists "rubricas_projeto_select" on public.rubricas_projeto;
create policy "rubricas_projeto_select"
on public.rubricas_projeto
for select
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_ver_projeto(projeto_id)
);

drop policy if exists "rubricas_projeto_insert" on public.rubricas_projeto;
create policy "rubricas_projeto_insert"
on public.rubricas_projeto
for insert
to authenticated
with check (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
);

drop policy if exists "rubricas_projeto_update" on public.rubricas_projeto;
create policy "rubricas_projeto_update"
on public.rubricas_projeto
for update
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
)
with check (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
);

drop policy if exists "rubricas_projeto_delete" on public.rubricas_projeto;
create policy "rubricas_projeto_delete"
on public.rubricas_projeto
for delete
to authenticated
using (false);

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists trg_rubricas_globais_data_atualizacao on public.rubricas_globais;
create trigger trg_rubricas_globais_data_atualizacao
before update on public.rubricas_globais
for each row
execute function public.definir_data_atualizacao();

drop trigger if exists trg_projetos_data_atualizacao on public.projetos;
create trigger trg_projetos_data_atualizacao
before update on public.projetos
for each row
execute function public.definir_data_atualizacao();

drop trigger if exists trg_projeto_links_data_atualizacao on public.projeto_links;
create trigger trg_projeto_links_data_atualizacao
before update on public.projeto_links
for each row
execute function public.definir_data_atualizacao();

drop trigger if exists trg_rubricas_projeto_data_atualizacao on public.rubricas_projeto;
create trigger trg_rubricas_projeto_data_atualizacao
before update on public.rubricas_projeto
for each row
execute function public.definir_data_atualizacao();

drop trigger if exists trg_projetos_impedir_troca_coordenador_sem_permissao on public.projetos;
create trigger trg_projetos_impedir_troca_coordenador_sem_permissao
before update of coordenador_id on public.projetos
for each row
when (old.coordenador_id is distinct from new.coordenador_id)
execute function public.projetos_impedir_troca_coordenador_sem_permissao();

drop trigger if exists trg_projetos_validar_alteracao_status on public.projetos;
create trigger trg_projetos_validar_alteracao_status
before update of status on public.projetos
for each row
when (old.status is distinct from new.status)
execute function public.projetos_validar_alteracao_status();

drop trigger if exists trg_projeto_links_limitar_maximo_dez on public.projeto_links;
create trigger trg_projeto_links_limitar_maximo_dez
before insert on public.projeto_links
for each row
execute function public.projeto_links_limitar_maximo_dez();

drop trigger if exists trg_projetos_validar_rubricas_financiamento_projetos on public.projetos;
create constraint trigger trg_projetos_validar_rubricas_financiamento_projetos
after insert or update of tipo, orcamento_total on public.projetos
initially deferred
for each row
execute function public.projetos_validar_rubricas_financiamento();

drop trigger if exists trg_projetos_validar_rubricas_financiamento_rubricas on public.rubricas_projeto;
create constraint trigger trg_projetos_validar_rubricas_financiamento_rubricas
after insert or update or delete on public.rubricas_projeto
initially deferred
for each row
execute function public.projetos_validar_rubricas_financiamento();

commit;