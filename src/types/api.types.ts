export type ResultadoErro = {
  sucesso: false;
  codigo: string;
  mensagem: string;
  detalhes?: unknown;
};

export type ResultadoSucesso<T> = {
  sucesso: true;
  dados: T;
  mensagem?: string;
};

export type ResultadoApi<T> = ResultadoSucesso<T> | ResultadoErro;