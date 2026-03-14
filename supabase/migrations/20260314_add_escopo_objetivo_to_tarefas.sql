begin;

-- =========================================================
-- ENUM DE ESCOPO DO OBJETIVO
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'escopo_objetivo'
      and n.nspname = 'public'
  ) then
    create type public.escopo_objetivo as enum ('global', 'equipe');
  end if;
end
$$;

-- =========================================================
-- NOVA COLUNA NA TABELA DE TAREFAS
-- =========================================================

alter table public.tarefas
add column if not exists escopo_objetivo public.escopo_objetivo null;

-- =========================================================
-- BACKFILL DOS OBJETIVOS JÁ EXISTENTES
-- =========================================================

update public.tarefas
set escopo_objetivo = 'global'
where tipo = 'pai'
  and escopo_objetivo is null;

-- =========================================================
-- REMOVER CONSTRAINT ANTIGA DE TAREFA-PAI
-- =========================================================

alter table public.tarefas
drop constraint if exists chk_tarefas_tipo_pai_campos;

-- =========================================================
-- NOVAS CONSTRAINTS
-- =========================================================

alter table public.tarefas
drop constraint if exists chk_tarefas_escopo_objetivo_coerente;

alter table public.tarefas
add constraint chk_tarefas_escopo_objetivo_coerente
check (
  (
    tipo = 'pai'
    and escopo_objetivo is not null
  )
  or
  (
    tipo <> 'pai'
    and escopo_objetivo is null
  )
);

alter table public.tarefas
add constraint chk_tarefas_tipo_pai_campos
check (
  tipo <> 'pai'
  or (
    tarefa_pai_id is null
    and categoria_id is null
    and (
      (escopo_objetivo = 'global' and equipe_id is null)
      or
      (escopo_objetivo = 'equipe' and equipe_id is not null)
    )
  )
);

-- =========================================================
-- ÍNDICE
-- =========================================================

create index if not exists idx_tarefas_escopo_objetivo
  on public.tarefas (escopo_objetivo);

commit;