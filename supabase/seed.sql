insert into public.equipes (id, nome, descricao)
values (
  '11111111-1111-1111-1111-111111111111',
  'Administração Geral',
  'Equipe base administrativa do ambiente local'
)
on conflict (nome) do update
set descricao = excluded.descricao,
    data_atualizacao = now();