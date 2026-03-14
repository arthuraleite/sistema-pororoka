export type EquipeListItem = {
  id: string;
  nome: string;
  descricao: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type EquipeDetalhe = EquipeListItem & {
  totalUsuarios?: number;
};

export type EquipeCreateInput = {
  nome: string;
  descricao?: string | null;
};

export type EquipeEditInput = {
  id: string;
  nome: string;
  descricao?: string | null;
};