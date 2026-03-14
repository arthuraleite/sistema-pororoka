-- =========================================================
-- FIX DE RLS RECURSIVO EM public.usuarios
-- =========================================================

drop policy if exists "configuradores_podem_ler_todos_usuarios" on public.usuarios;

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

create policy "configuradores_podem_ler_todos_usuarios"
on public.usuarios
for select
to authenticated
using (
  public.usuario_atual_eh_configurador()
);