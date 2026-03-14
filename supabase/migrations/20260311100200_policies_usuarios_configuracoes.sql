-- =========================================================
-- POLICIES COMPLEMENTARES DE USUÁRIOS
-- Módulo: Configurações
-- =========================================================

-- Leitura institucional de usuários por admin_supremo e coordenador_geral
create policy "configuradores_podem_ler_todos_usuarios"
on public.usuarios
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

-- Inserção administrativa de usuários institucionais
create policy "configuradores_podem_inserir_usuarios"
on public.usuarios
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

-- Atualização administrativa restrita a admin_supremo
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

create policy "usuarios_podem_ler_proprio_registro"
on public.usuarios
for select
to authenticated
using (auth.uid() = id);

create policy "usuarios_autenticados_podem_ler_equipes"
on public.equipes
for select
to authenticated
using (true);