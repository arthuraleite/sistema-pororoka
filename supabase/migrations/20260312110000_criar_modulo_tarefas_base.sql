begin;

-- =========================================================
-- ENUMS
-- =========================================================

create type public.tipo_tarefa as enum (
  'pai',
  'filha',
  'orfa'
);

create type public.status_tarefa as enum (
  'a_fazer',
  'em_andamento',
  'atencao',
  'em_atraso',
  'em_pausa',
  'concluida'
);

create type public.prioridade_tarefa as enum (
  'urgente',
  'alta',
  'media',
  'baixa'
);

create type public.tipo_evento_responsavel_tarefa as enum (
  'adicionado',
  'removido',
  'reatribuido'
);

create type public.tipo_notificacao_tarefa as enum (
  'nova_atribuicao',
  'responsavel_alterado_para_mim',
  'comentario_em_tarefa_acompanhada',
  'resposta_ao_meu_comentario',
  'prazo_proximo',
  'tarefa_em_atraso',
  'tarefa_reaberta'
);

create type public.alerta_prazo_tarefa as enum (
  'um_dia',
  'tres_dias',
  'uma_semana'
);

-- =========================================================
-- TABELA DE CATEGORIAS DE TAREFA
-- =========================================================

create table if not exists public.categorias_tarefa (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null,
  nome text not null,
  descricao text null,
  ativo boolean not null default true,
  criado_por_id uuid not null,
  atualizado_por_id uuid null,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint fk_categorias_tarefa_equipe
    foreign key (equipe_id)
    references public.equipes(id)
    on delete restrict,

  constraint fk_categorias_tarefa_criado_por
    foreign key (criado_por_id)
    references public.usuarios(id)
    on delete restrict,

  constraint fk_categorias_tarefa_atualizado_por
    foreign key (atualizado_por_id)
    references public.usuarios(id)
    on delete restrict,

  constraint chk_categorias_tarefa_nome_nao_vazio
    check (btrim(nome) <> '')
);

create unique index if not exists uq_categorias_tarefa_equipe_nome_ativo
  on public.categorias_tarefa (equipe_id, lower(nome))
  where ativo = true;

create unique index if not exists uq_categorias_tarefa_id_equipe
  on public.categorias_tarefa (id, equipe_id);

create index if not exists idx_categorias_tarefa_equipe_id
  on public.categorias_tarefa (equipe_id);

create index if not exists idx_categorias_tarefa_ativo
  on public.categorias_tarefa (ativo);

-- =========================================================
-- TABELA PRINCIPAL DE TAREFAS
-- =========================================================

create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_tarefa not null,
  titulo text not null,
  descricao text null,

  tarefa_pai_id uuid null,
  equipe_id uuid null,
  categoria_id uuid null,

  -- Integração futura com projetos:
  -- mantido sem FK por enquanto para não acoplar a uma modelagem
  -- que não está fechada neste escopo.
  projeto_id uuid null,

  prioridade public.prioridade_tarefa null,
  status public.status_tarefa not null default 'a_fazer',

  data_entrega date not null,
  hora_entrega time null,
  data_conclusao timestamptz null,

  criado_por_id uuid not null,
  atualizado_por_id uuid null,

  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint fk_tarefas_tarefa_pai
    foreign key (tarefa_pai_id)
    references public.tarefas(id)
    on delete restrict,

  constraint fk_tarefas_equipe
    foreign key (equipe_id)
    references public.equipes(id)
    on delete restrict,

  constraint fk_tarefas_categoria_equipe
    foreign key (categoria_id, equipe_id)
    references public.categorias_tarefa(id, equipe_id)
    on delete restrict,

  constraint fk_tarefas_criado_por
    foreign key (criado_por_id)
    references public.usuarios(id)
    on delete restrict,

  constraint fk_tarefas_atualizado_por
    foreign key (atualizado_por_id)
    references public.usuarios(id)
    on delete restrict,

  constraint chk_tarefas_titulo_nao_vazio
    check (btrim(titulo) <> ''),

  constraint chk_tarefas_tipo_pai_campos
    check (
      tipo <> 'pai'
      or (
        tarefa_pai_id is null
        and equipe_id is null
        and categoria_id is null
      )
    ),

  constraint chk_tarefas_tipo_filha_campos
    check (
      tipo <> 'filha'
      or (
        tarefa_pai_id is not null
        and equipe_id is not null
        and categoria_id is not null
        and prioridade is not null
      )
    ),

  constraint chk_tarefas_tipo_orfa_campos
    check (
      tipo <> 'orfa'
      or (
        tarefa_pai_id is null
        and equipe_id is not null
        and categoria_id is not null
        and prioridade is not null
      )
    ),

  constraint chk_tarefas_data_conclusao_status
    check (
      (status = 'concluida' and data_conclusao is not null)
      or
      (status <> 'concluida')
    )
);

create index if not exists idx_tarefas_tipo
  on public.tarefas (tipo);

create index if not exists idx_tarefas_status
  on public.tarefas (status);

create index if not exists idx_tarefas_prioridade
  on public.tarefas (prioridade);

create index if not exists idx_tarefas_tarefa_pai_id
  on public.tarefas (tarefa_pai_id);

create index if not exists idx_tarefas_equipe_id
  on public.tarefas (equipe_id);

create index if not exists idx_tarefas_categoria_id
  on public.tarefas (categoria_id);

create index if not exists idx_tarefas_data_entrega
  on public.tarefas (data_entrega);

create index if not exists idx_tarefas_data_criacao
  on public.tarefas (data_criacao desc);

create index if not exists idx_tarefas_projeto_id
  on public.tarefas (projeto_id);

-- =========================================================
-- RESPONSÁVEIS ATUAIS DA TAREFA
-- =========================================================

create table if not exists public.tarefas_responsaveis (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null,
  usuario_id uuid not null,
  atribuido_por_id uuid not null,
  data_criacao timestamptz not null default now(),

  constraint fk_tarefas_responsaveis_tarefa
    foreign key (tarefa_id)
    references public.tarefas(id)
    on delete cascade,

  constraint fk_tarefas_responsaveis_usuario
    foreign key (usuario_id)
    references public.usuarios(id)
    on delete restrict,

  constraint fk_tarefas_responsaveis_atribuido_por
    foreign key (atribuido_por_id)
    references public.usuarios(id)
    on delete restrict,

  constraint uq_tarefas_responsaveis_tarefa_usuario
    unique (tarefa_id, usuario_id)
);

create index if not exists idx_tarefas_responsaveis_tarefa_id
  on public.tarefas_responsaveis (tarefa_id);

create index if not exists idx_tarefas_responsaveis_usuario_id
  on public.tarefas_responsaveis (usuario_id);

-- =========================================================
-- HISTÓRICO DE RESPONSÁVEIS
-- =========================================================

create table if not exists public.tarefas_responsaveis_historico (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null,
  usuario_afetado_id uuid not null,
  alterado_por_id uuid not null,
  tipo_evento public.tipo_evento_responsavel_tarefa not null,
  data_evento timestamptz not null default now(),

  constraint fk_tarefas_resp_hist_tarefa
    foreign key (tarefa_id)
    references public.tarefas(id)
    on delete cascade,

  constraint fk_tarefas_resp_hist_usuario_afetado
    foreign key (usuario_afetado_id)
    references public.usuarios(id)
    on delete restrict,

  constraint fk_tarefas_resp_hist_alterado_por
    foreign key (alterado_por_id)
    references public.usuarios(id)
    on delete restrict
);

create index if not exists idx_tarefas_resp_hist_tarefa_id
  on public.tarefas_responsaveis_historico (tarefa_id);

create index if not exists idx_tarefas_resp_hist_usuario_afetado_id
  on public.tarefas_responsaveis_historico (usuario_afetado_id);

create index if not exists idx_tarefas_resp_hist_data_evento
  on public.tarefas_responsaveis_historico (data_evento desc);

-- =========================================================
-- LINKS DA TAREFA
-- =========================================================

create table if not exists public.tarefas_links (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null,
  url text not null,
  texto text null,
  criado_por_id uuid not null,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint fk_tarefas_links_tarefa
    foreign key (tarefa_id)
    references public.tarefas(id)
    on delete cascade,

  constraint fk_tarefas_links_criado_por
    foreign key (criado_por_id)
    references public.usuarios(id)
    on delete restrict,

  constraint chk_tarefas_links_url_nao_vazia
    check (btrim(url) <> '')
);

create index if not exists idx_tarefas_links_tarefa_id
  on public.tarefas_links (tarefa_id);

-- =========================================================
-- COMENTÁRIOS DA TAREFA
-- =========================================================

create table if not exists public.tarefas_comentarios (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null,
  comentario_pai_id uuid null,
  autor_id uuid not null,
  conteudo text not null,
  link_externo text null,
  editado boolean not null default false,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint fk_tarefas_comentarios_tarefa
    foreign key (tarefa_id)
    references public.tarefas(id)
    on delete cascade,

  constraint fk_tarefas_comentarios_comentario_pai
    foreign key (comentario_pai_id)
    references public.tarefas_comentarios(id)
    on delete cascade,

  constraint fk_tarefas_comentarios_autor
    foreign key (autor_id)
    references public.usuarios(id)
    on delete restrict,

  constraint chk_tarefas_comentarios_conteudo_nao_vazio
    check (btrim(conteudo) <> '')
);

create index if not exists idx_tarefas_comentarios_tarefa_id
  on public.tarefas_comentarios (tarefa_id);

create index if not exists idx_tarefas_comentarios_comentario_pai_id
  on public.tarefas_comentarios (comentario_pai_id);

create index if not exists idx_tarefas_comentarios_autor_id
  on public.tarefas_comentarios (autor_id);

create index if not exists idx_tarefas_comentarios_data_criacao
  on public.tarefas_comentarios (data_criacao asc);

-- =========================================================
-- CONFIGURAÇÃO DE ALERTA DE PRAZO POR USUÁRIO
-- =========================================================

create table if not exists public.configuracoes_alerta_tarefa (
  usuario_id uuid primary key,
  alerta_prazo public.alerta_prazo_tarefa not null default 'tres_dias',
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint fk_configuracoes_alerta_tarefa_usuario
    foreign key (usuario_id)
    references public.usuarios(id)
    on delete cascade
);

-- =========================================================
-- NOTIFICAÇÕES DO MÓDULO DE TAREFAS
-- =========================================================

create table if not exists public.tarefas_notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  tarefa_id uuid not null,
  comentario_id uuid null,
  tipo public.tipo_notificacao_tarefa not null,
  titulo text not null,
  descricao text null,
  lida boolean not null default false,
  data_criacao timestamptz not null default now(),
  data_expiracao timestamptz not null default (now() + interval '7 days'),

  constraint fk_tarefas_notificacoes_usuario
    foreign key (usuario_id)
    references public.usuarios(id)
    on delete cascade,

  constraint fk_tarefas_notificacoes_tarefa
    foreign key (tarefa_id)
    references public.tarefas(id)
    on delete cascade,

  constraint fk_tarefas_notificacoes_comentario
    foreign key (comentario_id)
    references public.tarefas_comentarios(id)
    on delete cascade,

  constraint chk_tarefas_notificacoes_titulo_nao_vazio
    check (btrim(titulo) <> '')
);

create index if not exists idx_tarefas_notificacoes_usuario_lida
  on public.tarefas_notificacoes (usuario_id, lida);

create index if not exists idx_tarefas_notificacoes_data_expiracao
  on public.tarefas_notificacoes (data_expiracao);

create index if not exists idx_tarefas_notificacoes_tarefa_id
  on public.tarefas_notificacoes (tarefa_id);

-- =========================================================
-- FUNÇÕES AUXILIARES
-- =========================================================

create or replace function public.definir_data_atualizacao()
returns trigger
language plpgsql
as $$
begin
  new.data_atualizacao = now();
  return new;
end;
$$;

create or replace function public.tarefas_impedir_exclusao_de_pai()
returns trigger
language plpgsql
as $$
begin
  if old.tipo = 'pai' then
    raise exception 'Tarefa-pai não pode ser excluída.'
      using errcode = 'P0001';
  end if;

  return old;
end;
$$;

create or replace function public.tarefas_validar_filha_com_pai_do_tipo_correto()
returns trigger
language plpgsql
as $$
declare
  v_tipo_pai public.tipo_tarefa;
begin
  if new.tipo = 'filha' then
    select tipo
      into v_tipo_pai
      from public.tarefas
     where id = new.tarefa_pai_id;

    if v_tipo_pai is distinct from 'pai' then
      raise exception 'Tarefa-filha deve referenciar uma tarefa-pai válida.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.tarefas_impedir_mudanca_equipe()
returns trigger
language plpgsql
as $$
begin
  if old.equipe_id is distinct from new.equipe_id then
    raise exception 'A equipe da tarefa não pode ser alterada após a criação.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.tarefas_ajustar_data_conclusao_por_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'concluida' and old.status is distinct from 'concluida' and new.data_conclusao is null then
    new.data_conclusao = now();
  end if;

  if new.status <> 'concluida' then
    new.data_conclusao = null;
  end if;

  return new;
end;
$$;

create or replace function public.tarefas_limitar_maximo_cinco_links()
returns trigger
language plpgsql
as $$
declare
  v_total integer;
begin
  select count(*)
    into v_total
    from public.tarefas_links
   where tarefa_id = new.tarefa_id;

  if tg_op = 'UPDATE' then
    return new;
  end if;

  if v_total >= 5 then
    raise exception 'A tarefa pode ter no máximo 5 links.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.tarefas_sincronizar_conclusao_pai()
returns trigger
language plpgsql
as $$
declare
  v_tarefa_pai_id uuid;
  v_total_filhas integer;
  v_total_filhas_concluidas integer;
begin
  v_tarefa_pai_id := coalesce(new.tarefa_pai_id, old.tarefa_pai_id);

  if v_tarefa_pai_id is null then
    return coalesce(new, old);
  end if;

  select count(*)
    into v_total_filhas
    from public.tarefas
   where tarefa_pai_id = v_tarefa_pai_id
     and tipo = 'filha';

  select count(*)
    into v_total_filhas_concluidas
    from public.tarefas
   where tarefa_pai_id = v_tarefa_pai_id
     and tipo = 'filha'
     and status = 'concluida';

  if v_total_filhas > 0 and v_total_filhas = v_total_filhas_concluidas then
    update public.tarefas
       set status = 'concluida',
           data_conclusao = coalesce(data_conclusao, now()),
           data_atualizacao = now()
     where id = v_tarefa_pai_id
       and tipo = 'pai';
  else
    update public.tarefas
       set status = case
                      when status = 'concluida' then 'em_andamento'::public.status_tarefa
                      else status
                    end,
           data_conclusao = null,
           data_atualizacao = now()
     where id = v_tarefa_pai_id
       and tipo = 'pai';
  end if;

  return coalesce(new, old);
end;
$$;

-- =========================================================
-- TRIGGERS
-- =========================================================

create trigger trg_categorias_tarefa_data_atualizacao
before update on public.categorias_tarefa
for each row
execute function public.definir_data_atualizacao();

create trigger trg_tarefas_data_atualizacao
before update on public.tarefas
for each row
execute function public.definir_data_atualizacao();

create trigger trg_tarefas_links_data_atualizacao
before update on public.tarefas_links
for each row
execute function public.definir_data_atualizacao();

create trigger trg_tarefas_comentarios_data_atualizacao
before update on public.tarefas_comentarios
for each row
execute function public.definir_data_atualizacao();

create trigger trg_configuracoes_alerta_tarefa_data_atualizacao
before update on public.configuracoes_alerta_tarefa
for each row
execute function public.definir_data_atualizacao();

create trigger trg_tarefas_impedir_exclusao_de_pai
before delete on public.tarefas
for each row
execute function public.tarefas_impedir_exclusao_de_pai();

create trigger trg_tarefas_validar_filha_com_pai_do_tipo_correto
before insert or update of tarefa_pai_id, tipo on public.tarefas
for each row
execute function public.tarefas_validar_filha_com_pai_do_tipo_correto();

create trigger trg_tarefas_impedir_mudanca_equipe
before update of equipe_id on public.tarefas
for each row
when (old.equipe_id is distinct from new.equipe_id)
execute function public.tarefas_impedir_mudanca_equipe();

create trigger trg_tarefas_ajustar_data_conclusao_por_status
before update of status, data_conclusao on public.tarefas
for each row
execute function public.tarefas_ajustar_data_conclusao_por_status();

create trigger trg_tarefas_limitar_maximo_cinco_links
before insert on public.tarefas_links
for each row
execute function public.tarefas_limitar_maximo_cinco_links();

create trigger trg_tarefas_sincronizar_conclusao_pai_insert
after insert on public.tarefas
for each row
when (new.tipo = 'filha')
execute function public.tarefas_sincronizar_conclusao_pai();

create trigger trg_tarefas_sincronizar_conclusao_pai_update
after update of status on public.tarefas
for each row
when (new.tipo = 'filha' and old.status is distinct from new.status)
execute function public.tarefas_sincronizar_conclusao_pai();

create trigger trg_tarefas_sincronizar_conclusao_pai_delete
after delete on public.tarefas
for each row
when (old.tipo = 'filha')
execute function public.tarefas_sincronizar_conclusao_pai();

commit;