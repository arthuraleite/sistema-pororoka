export type UsuarioAutenticado = {
  id: string;
  email: string;
  nome: string;
  avatarUrl?: string | null;
  perfil: string;
  equipeId?: string | null;
  status: string;
};