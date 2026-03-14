"use client";

import { useMemo, useState, useTransition } from "react";
import { buscarUsuarioAction } from "@/actions/configuracoes/usuarios/buscar-usuario";
import type {
  UsuarioDetalhe,
  UsuarioListItem,
} from "@/types/configuracoes/usuarios.types";
import type { EquipeListItem } from "@/types/configuracoes/equipes.types";
import { UsuariosToolbar } from "@/components/configuracoes/usuarios/usuarios-toolbar";
import { UsuariosTable } from "@/components/configuracoes/usuarios/usuarios-table";
import { UsuarioViewModal } from "@/components/configuracoes/usuarios/usuario-view-modal";
import { UsuarioCreateModal } from "@/components/configuracoes/usuarios/usuario-create-modal";
import { UsuarioEditModal } from "@/components/configuracoes/usuarios/usuario-edit-modal";
import { UsuarioPerfilModal } from "@/components/configuracoes/usuarios/usuario-perfil-modal";
import { UsuarioInativarModal } from "@/components/configuracoes/usuarios/usuario-inativar-modal";
import { UsuarioReativarModal } from "@/components/configuracoes/usuarios/usuario-reativar-modal";

type UsuariosPageClientProps = {
  usuarios: UsuarioListItem[];
  equipes: EquipeListItem[];
  podeCadastrar: boolean;
  podeEditar: boolean;
  podeAlterarPerfil: boolean;
  podeInativar: boolean;
  podeReativar: boolean;
};

export function UsuariosPageClient({
  usuarios,
  equipes,
  podeCadastrar,
  podeEditar,
  podeAlterarPerfil,
  podeInativar,
  podeReativar,
}: UsuariosPageClientProps) {
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [modalCriarAberta, setModalCriarAberta] = useState(false);
  const [modalVisualizarAberta, setModalVisualizarAberta] = useState(false);
  const [modalEditarAberta, setModalEditarAberta] = useState(false);
  const [modalPerfilAberta, setModalPerfilAberta] = useState(false);
  const [modalInativarAberta, setModalInativarAberta] = useState(false);
  const [modalReativarAberta, setModalReativarAberta] = useState(false);

  const [busca, setBusca] = useState("");
  const [perfilFiltro, setPerfilFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [equipeFiltro, setEquipeFiltro] = useState("");

  const usuariosUnicos = useMemo(
    () => Array.from(new Map(usuarios.map((usuario) => [usuario.id, usuario])).values()),
    [usuarios],
  );

  const equipesUnicas = useMemo(
    () => Array.from(new Map(equipes.map((equipe) => [equipe.id, equipe])).values()),
    [equipes],
  );

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return usuariosUnicos.filter((usuario) => {
      const bateBusca =
        termo.length === 0 ||
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo);

      const batePerfil =
        perfilFiltro.length === 0 || usuario.perfil === perfilFiltro;

      const bateStatus =
        statusFiltro.length === 0 || usuario.status === statusFiltro;

      const bateEquipe =
        equipeFiltro.length === 0 || usuario.equipeId === equipeFiltro;

      return bateBusca && batePerfil && bateStatus && bateEquipe;
    });
  }, [usuariosUnicos, busca, perfilFiltro, statusFiltro, equipeFiltro]);

  function handleReload() {
    window.location.reload();
  }

  function carregarUsuario(id: string, callback: (usuario: UsuarioDetalhe) => void) {
    setErro(null);

    startTransition(async () => {
      const response = await buscarUsuarioAction(id);

      if (!response.sucesso || !response.dados) {
        setErro(response.erro);
        return;
      }

      setUsuarioSelecionado(response.dados);
      callback(response.dados);
    });
  }

  return (
    <div className="space-y-6">
      <UsuariosToolbar
        podeCadastrar={podeCadastrar}
        onCadastrar={() => setModalCriarAberta(true)}
        busca={busca}
        onBuscaChange={setBusca}
        perfil={perfilFiltro}
        onPerfilChange={setPerfilFiltro}
        status={statusFiltro}
        onStatusChange={setStatusFiltro}
        equipeId={equipeFiltro}
        onEquipeChange={setEquipeFiltro}
        equipes={equipesUnicas}
      />

      {erro ? (
        <div className="status-danger rounded-xl px-4 py-3 text-sm">
          {erro}
        </div>
      ) : null}

      {isPending ? (
        <div className="status-neutral rounded-xl px-4 py-3 text-sm">
          Carregando dados do usuário...
        </div>
      ) : null}

      <UsuariosTable
        usuarios={usuariosFiltrados}
        podeEditar={podeEditar}
        podeAlterarPerfil={podeAlterarPerfil}
        podeInativar={podeInativar}
        podeReativar={podeReativar}
        onVisualizar={(id) =>
          carregarUsuario(id, () => setModalVisualizarAberta(true))
        }
        onEditar={(id) =>
          carregarUsuario(id, () => setModalEditarAberta(true))
        }
        onAlterarPerfil={(id) =>
          carregarUsuario(id, () => setModalPerfilAberta(true))
        }
        onInativar={(id) =>
          carregarUsuario(id, () => setModalInativarAberta(true))
        }
        onReativar={(id) =>
          carregarUsuario(id, () => setModalReativarAberta(true))
        }
      />

      <UsuarioCreateModal
        aberta={modalCriarAberta}
        equipes={equipesUnicas}
        onClose={() => setModalCriarAberta(false)}
        onSuccess={handleReload}
      />

      <UsuarioViewModal
        aberta={modalVisualizarAberta}
        usuario={usuarioSelecionado}
        onClose={() => {
          setModalVisualizarAberta(false);
          setUsuarioSelecionado(null);
        }}
      />

      <UsuarioEditModal
        aberta={modalEditarAberta}
        usuario={usuarioSelecionado}
        equipes={equipesUnicas}
        onClose={() => {
          setModalEditarAberta(false);
          setUsuarioSelecionado(null);
        }}
        onSuccess={handleReload}
      />

      <UsuarioPerfilModal
        aberta={modalPerfilAberta}
        usuario={usuarioSelecionado}
        onClose={() => {
          setModalPerfilAberta(false);
          setUsuarioSelecionado(null);
        }}
        onSuccess={handleReload}
      />

      <UsuarioInativarModal
        aberta={modalInativarAberta}
        usuario={usuarioSelecionado}
        onClose={() => {
          setModalInativarAberta(false);
          setUsuarioSelecionado(null);
        }}
        onSuccess={handleReload}
      />

      <UsuarioReativarModal
        aberta={modalReativarAberta}
        usuario={usuarioSelecionado}
        onClose={() => {
          setModalReativarAberta(false);
          setUsuarioSelecionado(null);
        }}
        onSuccess={handleReload}
      />
    </div>
  );
}