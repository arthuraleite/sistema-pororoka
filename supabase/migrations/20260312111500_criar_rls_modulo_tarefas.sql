begin;

-- =========================================================
-- FUNÇÕES AUXILIARES DE CONTEXTO E PERMISSÃO
-- =========================================================

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

create or replace function public.fn_eh_coordenacao_macro()
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
        'coordenador_equipe'
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
          u.perfil::text in ('membro', 'assistente', 'coordenador_equipe')
          and u.equipe_id = p_equipe_id
        )
        or (
          u.perfil::text = 'gestor_financeiro'
          and u.equipe_id = p_equipe_id
        )
      )
      and u.perfil::text <> 'analista_financeiro'
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
    select t.id, t.tipo, t.equipe_id
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
          and u.perfil in ('admin_supremo', 'coordenador_geral', 'coordenador_equipe')
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

create or replace function public.fn_pode_criar_tarefa_pai()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.fn_eh_coordenacao_macro()
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
          and exists (
            select 1
            from public.usuarios atual
            where atual.id = p_usuario_id
              and atual.perfil::text in ('admin_supremo', 'coordenador_geral', 'coordenador_equipe')
          )
        )
        or
        t.tipo in ('filha', 'orfa')
      )
  )
$$;

-- =========================================================
-- HABILITAR RLS
-- =========================================================

alter table public.categorias_tarefa enable row level security;
alter table public.tarefas enable row level security;
alter table public.tarefas_responsaveis enable row level security;
alter table public.tarefas_responsaveis_historico enable row level security;
alter table public.tarefas_links enable row level security;
alter table public.tarefas_comentarios enable row level security;
alter table public.configuracoes_alerta_tarefa enable row level security;
alter table public.tarefas_notificacoes enable row level security;

-- =========================================================
-- POLICIES - CATEGORIAS
-- =========================================================

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
      and public.fn_pode_criar_tarefa_pai()
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
  and public.fn_pode_ver_tarefa(id)
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
-- POLICIES - RESPONSÁVEIS ATUAIS
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

-- =========================================================
-- POLICIES - HISTÓRICO DE RESPONSÁVEIS
-- =========================================================

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
-- POLICIES - CONFIGURAÇÕES DE ALERTA POR USUÁRIO
-- =========================================================

create policy "configuracoes_alerta_tarefa_select"
on public.configuracoes_alerta_tarefa
for select
to authenticated
using (
  usuario_id = public.fn_usuario_auth_id()
);

create policy "configuracoes_alerta_tarefa_insert"
on public.configuracoes_alerta_tarefa
for insert
to authenticated
with check (
  usuario_id = public.fn_usuario_auth_id()
);

create policy "configuracoes_alerta_tarefa_update"
on public.configuracoes_alerta_tarefa
for update
to authenticated
using (
  usuario_id = public.fn_usuario_auth_id()
)
with check (
  usuario_id = public.fn_usuario_auth_id()
);

create policy "configuracoes_alerta_tarefa_delete"
on public.configuracoes_alerta_tarefa
for delete
to authenticated
using (
  usuario_id = public.fn_usuario_auth_id()
);

-- =========================================================
-- POLICIES - NOTIFICAÇÕES
-- =========================================================

create policy "tarefas_notificacoes_select"
on public.tarefas_notificacoes
for select
to authenticated
using (
  usuario_id = public.fn_usuario_auth_id()
);

create policy "tarefas_notificacoes_insert"
on public.tarefas_notificacoes
for insert
to authenticated
with check (
  usuario_id = public.fn_usuario_auth_id()
);

create policy "tarefas_notificacoes_update"
on public.tarefas_notificacoes
for update
to authenticated
using (
  usuario_id = public.fn_usuario_auth_id()
)
with check (
  usuario_id = public.fn_usuario_auth_id()
);

create policy "tarefas_notificacoes_delete"
on public.tarefas_notificacoes
for delete
to authenticated
using (
  usuario_id = public.fn_usuario_auth_id()
);

commit;