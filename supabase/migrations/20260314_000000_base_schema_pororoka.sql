begin;

-- =========================================================
-- BASELINE CONSOLIDADA DO SISTEMA POROROKA
-- USAR APENAS EM AMBIENTE LIMPO / APÓS RESET DO BANCO
-- MODELO OFICIAL:
--   public.usuarios.id = auth.users.id
-- =========================================================


create extension if not exists pgcrypto;
create extension if not exists unaccent;

create or replace function public.normalizar_texto_busca(valor text)
returns text
language sql
immutable
as $$
  select lower(public.unaccent(coalesce(btrim(valor), '')))
$$;

-- =========================================================
-- ENUMS DE USUÁRIOS
-- =========================================================

create type public.perfil_usuario as enum (
  'admin_supremo',
  'coordenador_geral',
  'gestor_financeiro',
  'coordenador_equipe',
  'assistente',
  'membro',
  'analista_financeiro'
);

create type public.status_usuario as enum (
  'ativo',
  'inativo'
);

-- =========================================================
-- ESTRUTURA BASE: EQUIPES, USUÁRIOS E AUDITORIA
-- =========================================================

create table public.equipes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

create table public.usuarios (
  id uuid primary key,
  email text not null unique,
  nome text not null,
  perfil public.perfil_usuario not null,
  equipe_id uuid references public.equipes(id) on delete set null,
  avatar_url text,
  status public.status_usuario not null default 'ativo',
  ultimo_login_em timestamptz,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now()
);

create index idx_usuarios_equipe_id on public.usuarios(equipe_id);
create index idx_usuarios_perfil on public.usuarios(perfil);
create index idx_usuarios_status on public.usuarios(status);

create table public.auditoria_eventos (
  id uuid primary key default gen_random_uuid(),
  ator_id uuid not null references public.usuarios(id) on delete restrict,
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  detalhes jsonb,
  data_evento timestamptz not null default now()
);

create index idx_auditoria_eventos_ator_id on public.auditoria_eventos(ator_id);
create index idx_auditoria_eventos_entidade on public.auditoria_eventos(entidade);
create index idx_auditoria_eventos_entidade_id on public.auditoria_eventos(entidade_id);
create index idx_auditoria_eventos_data_evento on public.auditoria_eventos(data_evento desc);


-- =========================================================
-- ENUMS DO MÓDULO DE PROJETOS
-- =========================================================

create type public.tipo_projeto as enum (
  'financiado',
  'interno'
);

create type public.status_projeto as enum (
  'a_iniciar',
  'em_andamento',
  'finalizado',
  'concluido'
);

-- =========================================================
-- TABELAS DO MÓDULO DE PROJETOS
-- =========================================================

create table public.rubricas_globais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text null,
  ativa boolean not null default true,
  criado_por_id uuid null,
  atualizado_por_id uuid null,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint fk_rubricas_globais_criado_por
    foreign key (criado_por_id)
    references public.usuarios(id)
    on delete set null,

  constraint fk_rubricas_globais_atualizado_por
    foreign key (atualizado_por_id)
    references public.usuarios(id)
    on delete set null,

  constraint chk_rubricas_globais_nome_nao_vazio
    check (btrim(nome) <> '')
);

create unique index uq_rubricas_globais_nome_ativo_normalizado
  on public.rubricas_globais (public.normalizar_texto_busca(nome))
  where ativa = true;

create index idx_rubricas_globais_ativa on public.rubricas_globais (ativa);
create index idx_rubricas_globais_data_criacao on public.rubricas_globais (data_criacao desc);

create table public.projetos (
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
  data_atualizacao timestamptz not null default now(),

  constraint fk_projetos_coordenador
    foreign key (coordenador_id)
    references public.usuarios(id)
    on delete restrict,

  constraint uq_projetos_sigla
    unique (sigla),

  constraint chk_projetos_nome_nao_vazio
    check (btrim(nome) <> ''),

  constraint chk_projetos_sigla_nao_vazia
    check (btrim(sigla) <> ''),

  constraint chk_projetos_data_fim_maior_ou_igual_inicio
    check (data_fim is null or data_fim >= data_inicio),

  constraint chk_projetos_regras_tipo
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
    )
);

create index idx_projetos_tipo on public.projetos (tipo);
create index idx_projetos_status on public.projetos (status);
create index idx_projetos_coordenador_id on public.projetos (coordenador_id);
create index idx_projetos_data_inicio on public.projetos (data_inicio);
create index idx_projetos_data_criacao on public.projetos (data_criacao desc);

create table public.projeto_links (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null,
  titulo text not null,
  url text not null,
  ordem integer not null default 1,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint fk_projeto_links_projeto
    foreign key (projeto_id)
    references public.projetos(id)
    on delete cascade,

  constraint chk_projeto_links_titulo_nao_vazio
    check (btrim(titulo) <> ''),

  constraint chk_projeto_links_url_nao_vazia
    check (btrim(url) <> ''),

  constraint chk_projeto_links_ordem_positiva
    check (ordem > 0)
);

create index idx_projeto_links_projeto_id on public.projeto_links (projeto_id);
create index idx_projeto_links_projeto_ordem on public.projeto_links (projeto_id, ordem);

create table public.rubricas_projeto (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null,
  rubrica_global_id uuid not null,
  limite_teto_gasto numeric(14,2) not null,
  ativa boolean not null default true,
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint fk_rubricas_projeto_projeto
    foreign key (projeto_id)
    references public.projetos(id)
    on delete cascade,

  constraint fk_rubricas_projeto_rubrica_global
    foreign key (rubrica_global_id)
    references public.rubricas_globais(id)
    on delete restrict,

  constraint uq_rubricas_projeto_projeto_rubrica
    unique (projeto_id, rubrica_global_id),

  constraint chk_rubricas_projeto_limite_nao_negativo
    check (limite_teto_gasto >= 0)
);

create index idx_rubricas_projeto_projeto_id on public.rubricas_projeto (projeto_id);
create index idx_rubricas_projeto_rubrica_global_id on public.rubricas_projeto (rubrica_global_id);
create index idx_rubricas_projeto_ativa on public.rubricas_projeto (ativa);

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

create type public.escopo_objetivo as enum (
  'global',
  'equipe'
);

-- =========================================================
-- TABELAS DO MÓDULO DE TAREFAS
-- =========================================================

create table public.categorias_tarefa (
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

create unique index uq_categorias_tarefa_equipe_nome_ativo
  on public.categorias_tarefa (equipe_id, lower(nome))
  where ativo = true;

create unique index uq_categorias_tarefa_id_equipe
  on public.categorias_tarefa (id, equipe_id);

create index idx_categorias_tarefa_equipe_id on public.categorias_tarefa (equipe_id);
create index idx_categorias_tarefa_ativo on public.categorias_tarefa (ativo);

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_tarefa not null,
  escopo_objetivo public.escopo_objetivo null,
  titulo text not null,
  descricao text null,

  tarefa_pai_id uuid null,
  equipe_id uuid null,
  categoria_id uuid null,
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
  constraint fk_tarefas_projeto
    foreign key (projeto_id)
    references public.projetos(id)
    on delete set null,

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

  constraint chk_tarefas_escopo_objetivo_coerente
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
    ),

  constraint chk_tarefas_tipo_pai_campos
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
      or (status <> 'concluida')
    )
);

create index idx_tarefas_tipo on public.tarefas (tipo);
create index idx_tarefas_escopo_objetivo on public.tarefas (escopo_objetivo);
create index idx_tarefas_status on public.tarefas (status);
create index idx_tarefas_prioridade on public.tarefas (prioridade);
create index idx_tarefas_tarefa_pai_id on public.tarefas (tarefa_pai_id);
create index idx_tarefas_equipe_id on public.tarefas (equipe_id);
create index idx_tarefas_categoria_id on public.tarefas (categoria_id);
create index idx_tarefas_data_entrega on public.tarefas (data_entrega);
create index idx_tarefas_data_criacao on public.tarefas (data_criacao desc);
create index idx_tarefas_projeto_id on public.tarefas (projeto_id);

create table public.tarefas_responsaveis (
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

create index idx_tarefas_responsaveis_tarefa_id on public.tarefas_responsaveis (tarefa_id);
create index idx_tarefas_responsaveis_usuario_id on public.tarefas_responsaveis (usuario_id);

create table public.tarefas_responsaveis_historico (
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

create index idx_tarefas_resp_hist_tarefa_id on public.tarefas_responsaveis_historico (tarefa_id);
create index idx_tarefas_resp_hist_usuario_afetado_id on public.tarefas_responsaveis_historico (usuario_afetado_id);
create index idx_tarefas_resp_hist_data_evento on public.tarefas_responsaveis_historico (data_evento desc);

create table public.tarefas_links (
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

create index idx_tarefas_links_tarefa_id on public.tarefas_links (tarefa_id);

create table public.tarefas_comentarios (
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

create index idx_tarefas_comentarios_tarefa_id on public.tarefas_comentarios (tarefa_id);
create index idx_tarefas_comentarios_comentario_pai_id on public.tarefas_comentarios (comentario_pai_id);
create index idx_tarefas_comentarios_autor_id on public.tarefas_comentarios (autor_id);
create index idx_tarefas_comentarios_data_criacao on public.tarefas_comentarios (data_criacao asc);

create table public.configuracoes_alerta_tarefa (
  usuario_id uuid primary key,
  alerta_prazo public.alerta_prazo_tarefa not null default 'tres_dias',
  data_criacao timestamptz not null default now(),
  data_atualizacao timestamptz not null default now(),

  constraint fk_configuracoes_alerta_tarefa_usuario
    foreign key (usuario_id)
    references public.usuarios(id)
    on delete cascade
);

create table public.tarefas_notificacoes (
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

create index idx_tarefas_notificacoes_usuario_lida on public.tarefas_notificacoes (usuario_id, lida);
create index idx_tarefas_notificacoes_data_expiracao on public.tarefas_notificacoes (data_expiracao);
create index idx_tarefas_notificacoes_tarefa_id on public.tarefas_notificacoes (tarefa_id);

-- =========================================================
-- FUNÇÕES AUXILIARES GERAIS
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

create or replace function public.marcar_tarefas_em_atraso_no_acesso()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  update public.tarefas
     set status = 'em_atraso'::public.status_tarefa,
         data_atualizacao = now()
   where status in (
     'a_fazer'::public.status_tarefa,
     'em_andamento'::public.status_tarefa,
     'atencao'::public.status_tarefa
   )
     and (
       (
         hora_entrega is not null
         and now() >= (data_entrega::timestamp + hora_entrega)
       )
       or
       (
         hora_entrega is null
         and now() >= (data_entrega::timestamp + time '23:59:59')
       )
     );

  get diagnostics v_total = row_count;
  return v_total;
end;
$$;

create or replace function public.usuario_atual_eh_configurador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios
    where id = auth.uid()
      and status = 'ativo'
      and perfil in ('admin_supremo', 'coordenador_geral')
  );
$$;


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
      raise exception 'Usuário atual não encontrado.' using errcode = 'P0001';
    end if;

    if v_perfil not in ('admin_supremo', 'coordenador_geral') and old.coordenador_id <> auth.uid() then
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

create or replace function public.fn_usuario_auth_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.fn_usuario_atual()
returns public.usuarios
language sql
stable
security definer
set search_path = public
as $$
  select u.*
  from public.usuarios u
  where u.id = auth.uid()
  limit 1
$$;

create or replace function public.fn_usuario_ativo()
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
  )
$$;

create or replace function public.fn_perfil_atual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.perfil::text
  from public.usuarios u
  where u.id = auth.uid()
  limit 1
$$;

create or replace function public.fn_equipe_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.equipe_id
  from public.usuarios u
  where u.id = auth.uid()
  limit 1
$$;

create or replace function public.fn_tem_acesso_modulo_tarefas()
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
      and u.perfil::text in (
        'admin_supremo',
        'coordenador_geral',
        'gestor_financeiro',
        'coordenador_equipe',
        'assistente',
        'membro'
      )
  )
$$;

create or replace function public.fn_eh_admin_ou_coordenacao_global()
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
      and u.perfil::text in ('admin_supremo', 'coordenador_geral')
  )
$$;

create or replace function public.fn_pode_gerir_categoria_equipe(p_equipe_id uuid)
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
        u.perfil::text in ('admin_supremo', 'coordenador_geral')
        or (
          u.perfil::text in ('coordenador_equipe', 'assistente', 'gestor_financeiro')
          and u.equipe_id = p_equipe_id
        )
      )
  )
$$;

create or replace function public.fn_pode_criar_na_equipe(p_equipe_id uuid)
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
        u.perfil::text in ('admin_supremo', 'coordenador_geral')
        or (
          u.perfil::text in ('membro', 'assistente', 'coordenador_equipe', 'gestor_financeiro')
          and u.equipe_id = p_equipe_id
        )
      )
      and u.perfil::text <> 'analista_financeiro'
  )
$$;

create or replace function public.fn_pode_criar_objetivo(
  p_escopo public.escopo_objetivo,
  p_equipe_id uuid
)
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
        (
          p_escopo = 'global'
          and u.perfil::text in ('admin_supremo', 'coordenador_geral')
        )
        or
        (
          p_escopo = 'equipe'
          and (
            u.perfil::text in ('admin_supremo', 'coordenador_geral')
            or (
              u.perfil::text in ('coordenador_equipe', 'assistente', 'gestor_financeiro')
              and u.equipe_id = p_equipe_id
            )
          )
        )
      )
  )
$$;

create or replace function public.fn_pode_ver_tarefa(p_tarefa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with usuario_atual as (
    select u.id, u.perfil::text as perfil, u.equipe_id, u.status::text as status
    from public.usuarios u
    where u.id = auth.uid()
    limit 1
  ),
  tarefa_alvo as (
    select t.id, t.tipo, t.escopo_objetivo, t.equipe_id
    from public.tarefas t
    where t.id = p_tarefa_id
    limit 1
  )
  select exists (
    select 1
    from usuario_atual u
    cross join tarefa_alvo t
    where u.status = 'ativo'
      and u.perfil <> 'analista_financeiro'
      and (
        (
          t.tipo = 'pai'
          and (
            (
              t.escopo_objetivo = 'global'
              and u.perfil in ('admin_supremo', 'coordenador_geral')
            )
            or
            (
              t.escopo_objetivo = 'equipe'
              and (
                u.perfil in ('admin_supremo', 'coordenador_geral')
                or (
                  u.perfil in ('coordenador_equipe', 'assistente', 'gestor_financeiro')
                  and u.equipe_id = t.equipe_id
                )
              )
            )
          )
        )
        or
        (
          t.tipo in ('filha', 'orfa')
          and (
            u.perfil in ('admin_supremo', 'coordenador_geral')
            or u.equipe_id = t.equipe_id
            or exists (
              select 1
              from public.tarefas_responsaveis tr
              where tr.tarefa_id = t.id
                and tr.usuario_id = u.id
            )
          )
        )
      )
  )
$$;

create or replace function public.fn_pode_gerir_responsaveis_tarefa(p_tarefa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.fn_pode_ver_tarefa(p_tarefa_id)
$$;

create or replace function public.fn_pode_comentar_tarefa(p_tarefa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.fn_pode_ver_tarefa(p_tarefa_id)
$$;

create or replace function public.fn_pode_criar_tarefa_operacional(
  p_tipo public.tipo_tarefa,
  p_equipe_id uuid,
  p_tarefa_pai_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when p_tipo = 'orfa' then
        public.fn_pode_criar_na_equipe(p_equipe_id)
      when p_tipo = 'filha' then
        public.fn_pode_criar_na_equipe(p_equipe_id)
        and p_tarefa_pai_id is not null
        and public.fn_pode_ver_tarefa(p_tarefa_pai_id)
      else
        false
    end
$$;

create or replace function public.fn_responsavel_elegivel_para_tarefa(
  p_tarefa_id uuid,
  p_usuario_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with tarefa_alvo as (
    select t.id, t.tipo
    from public.tarefas t
    where t.id = p_tarefa_id
    limit 1
  ),
  usuario_alvo as (
    select u.id, u.perfil::text as perfil, u.status::text as status
    from public.usuarios u
    where u.id = p_usuario_id
    limit 1
  )
  select exists (
    select 1
    from tarefa_alvo t
    cross join usuario_alvo u
    where u.status = 'ativo'
      and u.perfil <> 'analista_financeiro'
      and (
        (
          t.tipo = 'pai'
          and u.perfil in ('admin_supremo', 'coordenador_geral', 'coordenador_equipe', 'assistente', 'gestor_financeiro')
        )
        or
        t.tipo in ('filha', 'orfa')
      )
  )
$$;

-- =========================================================
-- FUNÇÕES E TRIGGERS DO MÓDULO DE TAREFAS
-- =========================================================

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
-- RLS
-- =========================================================

alter table public.equipes enable row level security;
alter table public.usuarios enable row level security;
alter table public.auditoria_eventos enable row level security;
alter table public.rubricas_globais enable row level security;
alter table public.projetos enable row level security;
alter table public.projeto_links enable row level security;
alter table public.rubricas_projeto enable row level security;
alter table public.categorias_tarefa enable row level security;
alter table public.tarefas enable row level security;
alter table public.tarefas_responsaveis enable row level security;
alter table public.tarefas_responsaveis_historico enable row level security;
alter table public.tarefas_links enable row level security;
alter table public.tarefas_comentarios enable row level security;
alter table public.configuracoes_alerta_tarefa enable row level security;
alter table public.tarefas_notificacoes enable row level security;

-- =========================================================
-- POLICIES - USUÁRIOS, EQUIPES E AUDITORIA
-- =========================================================

create policy "usuarios_ativos_podem_ler_usuarios"
on public.usuarios
for select
to authenticated
using (public.fn_usuario_ativo());

create policy "configuradores_podem_inserir_usuarios"
on public.usuarios
for insert
to authenticated
with check (public.usuario_atual_eh_configurador());

create policy "admins_supremos_podem_atualizar_usuarios"
on public.usuarios
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

create policy "usuarios_autenticados_podem_ler_equipes"
on public.equipes
for select
to authenticated
using (true);

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
-- POLICIES - PROJETOS E RUBRICAS
-- =========================================================

create policy "rubricas_globais_select"
on public.rubricas_globais
for select
to authenticated
using (public.fn_usuario_ativo());

create policy "rubricas_globais_insert"
on public.rubricas_globais
for insert
to authenticated
with check (public.fn_pode_gerir_rubrica_global());

create policy "rubricas_globais_update"
on public.rubricas_globais
for update
to authenticated
using (public.fn_pode_gerir_rubrica_global())
with check (public.fn_pode_gerir_rubrica_global());

create policy "rubricas_globais_delete"
on public.rubricas_globais
for delete
to authenticated
using (false);

create policy "projetos_select"
on public.projetos
for select
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_ver_projeto(id)
);

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

create policy "projetos_delete"
on public.projetos
for delete
to authenticated
using (false);

create policy "projeto_links_select"
on public.projeto_links
for select
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_ver_projeto(projeto_id)
);

create policy "projeto_links_insert"
on public.projeto_links
for insert
to authenticated
with check (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
);

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

create policy "projeto_links_delete"
on public.projeto_links
for delete
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
);

create policy "rubricas_projeto_select"
on public.rubricas_projeto
for select
to authenticated
using (
  public.fn_usuario_ativo()
  and public.fn_pode_ver_projeto(projeto_id)
);

create policy "rubricas_projeto_insert"
on public.rubricas_projeto
for insert
to authenticated
with check (
  public.fn_usuario_ativo()
  and public.fn_pode_editar_projeto(projeto_id)
);

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

create policy "rubricas_projeto_delete"
on public.rubricas_projeto
for delete
to authenticated
using (false);

create policy "categorias_tarefa_select"
on public.categorias_tarefa
for select
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and (
    public.fn_eh_admin_ou_coordenacao_global()
    or equipe_id = public.fn_equipe_atual()
  )
);

create policy "categorias_tarefa_insert"
on public.categorias_tarefa
for insert
to authenticated
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_gerir_categoria_equipe(equipe_id)
  and criado_por_id = public.fn_usuario_auth_id()
);

create policy "categorias_tarefa_update"
on public.categorias_tarefa
for update
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_gerir_categoria_equipe(equipe_id)
)
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_gerir_categoria_equipe(equipe_id)
);

create policy "categorias_tarefa_delete"
on public.categorias_tarefa
for delete
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_gerir_categoria_equipe(equipe_id)
);

-- =========================================================
-- POLICIES - TAREFAS
-- =========================================================

create policy "tarefas_select"
on public.tarefas
for select
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(id)
);

create policy "tarefas_insert"
on public.tarefas
for insert
to authenticated
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and (
    (
      tipo = 'pai'
      and public.fn_pode_criar_objetivo(escopo_objetivo, equipe_id)
      and criado_por_id = public.fn_usuario_auth_id()
    )
    or
    (
      tipo in ('filha', 'orfa')
      and public.fn_pode_criar_tarefa_operacional(tipo, equipe_id, tarefa_pai_id)
      and criado_por_id = public.fn_usuario_auth_id()
    )
  )
);

create policy "tarefas_update"
on public.tarefas
for update
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(id)
)
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and (
    (
      tipo = 'pai'
      and public.fn_pode_criar_objetivo(escopo_objetivo, equipe_id)
    )
    or
    (
      tipo in ('filha', 'orfa')
      and public.fn_pode_ver_tarefa(id)
    )
  )
);

create policy "tarefas_delete"
on public.tarefas
for delete
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(id)
  and tipo <> 'pai'
);

-- =========================================================
-- POLICIES - RESPONSÁVEIS
-- =========================================================

create policy "tarefas_responsaveis_select"
on public.tarefas_responsaveis
for select
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(tarefa_id)
);

create policy "tarefas_responsaveis_insert"
on public.tarefas_responsaveis
for insert
to authenticated
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_gerir_responsaveis_tarefa(tarefa_id)
  and atribuido_por_id = public.fn_usuario_auth_id()
  and public.fn_responsavel_elegivel_para_tarefa(tarefa_id, usuario_id)
);

create policy "tarefas_responsaveis_update"
on public.tarefas_responsaveis
for update
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_gerir_responsaveis_tarefa(tarefa_id)
)
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_gerir_responsaveis_tarefa(tarefa_id)
  and public.fn_responsavel_elegivel_para_tarefa(tarefa_id, usuario_id)
);

create policy "tarefas_responsaveis_delete"
on public.tarefas_responsaveis
for delete
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_gerir_responsaveis_tarefa(tarefa_id)
);

create policy "tarefas_responsaveis_historico_select"
on public.tarefas_responsaveis_historico
for select
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(tarefa_id)
);

create policy "tarefas_responsaveis_historico_insert"
on public.tarefas_responsaveis_historico
for insert
to authenticated
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_gerir_responsaveis_tarefa(tarefa_id)
  and alterado_por_id = public.fn_usuario_auth_id()
);

create policy "tarefas_responsaveis_historico_update"
on public.tarefas_responsaveis_historico
for update
to authenticated
using (false)
with check (false);

create policy "tarefas_responsaveis_historico_delete"
on public.tarefas_responsaveis_historico
for delete
to authenticated
using (false);

-- =========================================================
-- POLICIES - LINKS
-- =========================================================

create policy "tarefas_links_select"
on public.tarefas_links
for select
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(tarefa_id)
);

create policy "tarefas_links_insert"
on public.tarefas_links
for insert
to authenticated
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(tarefa_id)
  and criado_por_id = public.fn_usuario_auth_id()
);

create policy "tarefas_links_update"
on public.tarefas_links
for update
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(tarefa_id)
)
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(tarefa_id)
);

create policy "tarefas_links_delete"
on public.tarefas_links
for delete
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_ver_tarefa(tarefa_id)
);

-- =========================================================
-- POLICIES - COMENTÁRIOS
-- =========================================================

create policy "tarefas_comentarios_select"
on public.tarefas_comentarios
for select
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_comentar_tarefa(tarefa_id)
);

create policy "tarefas_comentarios_insert"
on public.tarefas_comentarios
for insert
to authenticated
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_comentar_tarefa(tarefa_id)
  and autor_id = public.fn_usuario_auth_id()
);

create policy "tarefas_comentarios_update"
on public.tarefas_comentarios
for update
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_comentar_tarefa(tarefa_id)
  and autor_id = public.fn_usuario_auth_id()
)
with check (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_comentar_tarefa(tarefa_id)
  and autor_id = public.fn_usuario_auth_id()
);

create policy "tarefas_comentarios_delete"
on public.tarefas_comentarios
for delete
to authenticated
using (
  public.fn_tem_acesso_modulo_tarefas()
  and public.fn_pode_comentar_tarefa(tarefa_id)
  and (
    autor_id = public.fn_usuario_auth_id()
    or public.fn_perfil_atual() in (
      'admin_supremo',
      'coordenador_geral',
      'gestor_financeiro',
      'coordenador_equipe',
      'assistente'
    )
  )
);

-- =========================================================
-- POLICIES - ALERTAS E NOTIFICAÇÕES
-- =========================================================

create policy "configuracoes_alerta_tarefa_select"
on public.configuracoes_alerta_tarefa
for select
to authenticated
using (usuario_id = public.fn_usuario_auth_id());

create policy "configuracoes_alerta_tarefa_insert"
on public.configuracoes_alerta_tarefa
for insert
to authenticated
with check (usuario_id = public.fn_usuario_auth_id());

create policy "configuracoes_alerta_tarefa_update"
on public.configuracoes_alerta_tarefa
for update
to authenticated
using (usuario_id = public.fn_usuario_auth_id())
with check (usuario_id = public.fn_usuario_auth_id());

create policy "configuracoes_alerta_tarefa_delete"
on public.configuracoes_alerta_tarefa
for delete
to authenticated
using (usuario_id = public.fn_usuario_auth_id());

create policy "tarefas_notificacoes_select"
on public.tarefas_notificacoes
for select
to authenticated
using (usuario_id = public.fn_usuario_auth_id());

create policy "tarefas_notificacoes_insert"
on public.tarefas_notificacoes
for insert
to authenticated
with check (usuario_id = public.fn_usuario_auth_id());

create policy "tarefas_notificacoes_update"
on public.tarefas_notificacoes
for update
to authenticated
using (usuario_id = public.fn_usuario_auth_id())
with check (usuario_id = public.fn_usuario_auth_id());

create policy "tarefas_notificacoes_delete"
on public.tarefas_notificacoes
for delete
to authenticated
using (usuario_id = public.fn_usuario_auth_id());

-- =========================================================
-- TRIGGERS
-- =========================================================

create trigger trg_equipes_data_atualizacao
before update on public.equipes
for each row
execute function public.definir_data_atualizacao();

create trigger trg_usuarios_data_atualizacao
before update on public.usuarios
for each row
execute function public.definir_data_atualizacao();

create trigger trg_rubricas_globais_data_atualizacao
before update on public.rubricas_globais
for each row
execute function public.definir_data_atualizacao();

create trigger trg_projetos_data_atualizacao
before update on public.projetos
for each row
execute function public.definir_data_atualizacao();

create trigger trg_projeto_links_data_atualizacao
before update on public.projeto_links
for each row
execute function public.definir_data_atualizacao();

create trigger trg_rubricas_projeto_data_atualizacao
before update on public.rubricas_projeto
for each row
execute function public.definir_data_atualizacao();

create trigger trg_projetos_impedir_troca_coordenador_sem_permissao
before update of coordenador_id on public.projetos
for each row
when (old.coordenador_id is distinct from new.coordenador_id)
execute function public.projetos_impedir_troca_coordenador_sem_permissao();

create trigger trg_projetos_validar_alteracao_status
before update of status on public.projetos
for each row
when (old.status is distinct from new.status)
execute function public.projetos_validar_alteracao_status();

create trigger trg_projeto_links_limitar_maximo_dez
before insert on public.projeto_links
for each row
execute function public.projeto_links_limitar_maximo_dez();

create constraint trigger trg_projetos_validar_rubricas_financiamento_projetos
after insert or update of tipo, orcamento_total on public.projetos
initially deferred
for each row
execute function public.projetos_validar_rubricas_financiamento();

create constraint trigger trg_projetos_validar_rubricas_financiamento_rubricas
after insert or update or delete on public.rubricas_projeto
initially deferred
for each row
execute function public.projetos_validar_rubricas_financiamento();

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
