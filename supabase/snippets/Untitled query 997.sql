begin;

create extension if not exists unaccent;

create or replace function public.normalizar_texto_busca(valor text)
returns text
language sql
immutable
as $$
  select lower(public.unaccent(coalesce(btrim(valor), '')))
$$;

drop index if exists public.uq_rubricas_globais_nome_ativo_normalizado;

create unique index uq_rubricas_globais_nome_ativo_normalizado
  on public.rubricas_globais (public.normalizar_texto_busca(nome))
  where ativa = true;

commit;