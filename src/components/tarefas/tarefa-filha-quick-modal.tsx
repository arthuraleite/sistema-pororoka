"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Tag, Users, X } from "lucide-react";

import { TarefaResponsaveisField } from "@/components/tarefas/tarefa-responsaveis-field";
import type {
  CategoriaTarefa,
  PrioridadeTarefa,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";
import type { TarefaFilhaDraft } from "@/components/tarefas/hooks/use-tarefa-pai-draft";

type EquipeOption = {
  id: string;
  nome: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    values: Omit<TarefaFilhaDraft, "idLocal" | "status"> & {
      status?: TarefaFilhaDraft["status"];
    },
  ) => void | Promise<void>;
  equipes: EquipeOption[];
  categorias: CategoriaTarefa[];
  usuarios: UsuarioResumoTarefa[];
  equipePredefinidaId?: string | null;
  bloquearEquipe?: boolean;
  initialValues?: Partial<TarefaFilhaDraft> | null;
};

type FormState = {
  titulo: string;
  descricao: string;
  equipeId: string;
  categoriaId: string;
  prioridade: PrioridadeTarefa;
  dataEntrega: string;
  horaEntrega: string;
  responsavelIds: string[];
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const PRIORIDADES: Array<{ value: PrioridadeTarefa; label: string }> = [
  { value: "urgente", label: "Urgente" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

function criarEstadoInicial(
  equipePredefinidaId?: string | null,
  initialValues?: Partial<TarefaFilhaDraft> | null,
): FormState {
  return {
    titulo: initialValues?.titulo ?? "",
    descricao: initialValues?.descricao ?? "",
    equipeId: initialValues?.equipeId ?? equipePredefinidaId ?? "",
    categoriaId: initialValues?.categoriaId ?? "",
    prioridade: initialValues?.prioridade ?? "media",
    dataEntrega: initialValues?.dataEntrega ?? "",
    horaEntrega: initialValues?.horaEntrega ?? "",
    responsavelIds: initialValues?.responsavelIds ?? [],
  };
}

function SelectField({
  label,
  required,
  value,
  onChange,
  children,
  disabled,
  error,
  icon,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  error?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-2 flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-2)" }}
      >
        {icon ? <span style={{ color: "var(--text-4)" }}>{icon}</span> : null}
        <span>
          {label}
          {required ? <span style={{ color: "var(--danger)" }}> *</span> : null}
        </span>
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-2xl px-4 py-3 pr-10 text-sm outline-none transition"
          style={{
            backgroundColor: "var(--input)",
            border: "1px solid var(--border)",
            color: "var(--text-1)",
            opacity: disabled ? 0.65 : 1,
          }}
        >
          {children}
        </select>

        <span
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center"
          style={{ color: "var(--text-4)" }}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </div>

      {error ? (
        <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TarefaFilhaQuickModalContent({
  onClose,
  onSubmit,
  equipes,
  categorias,
  usuarios,
  equipePredefinidaId,
  bloquearEquipe = false,
  initialValues,
}: Omit<Props, "open">) {
  const estadoInicial = useMemo(
    () => criarEstadoInicial(equipePredefinidaId, initialValues),
    [equipePredefinidaId, initialValues],
  );

  const [form, setForm] = useState<FormState>(estadoInicial);
  const [errors, setErrors] = useState<FormErrors>({});

  const categoriasFiltradas = useMemo(() => {
    if (!form.equipeId) {
      return categorias;
    }

    return categorias.filter(
      (categoria) =>
        categoria.equipeId === form.equipeId || categoria.equipeId === null,
    );
  }, [categorias, form.equipeId]);

  function atualizarCampo<K extends keyof FormState>(
    campo: K,
    valor: FormState[K],
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErrors((atual) => ({ ...atual, [campo]: undefined }));
  }

  function validar(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!form.titulo.trim()) {
      nextErrors.titulo = "Informe o título da tarefa filha.";
    }

    if (!form.equipeId.trim()) {
      nextErrors.equipeId = "Selecione a equipe.";
    }

    if (!form.categoriaId.trim()) {
      nextErrors.categoriaId = "Selecione a categoria.";
    }

    if (!form.dataEntrega.trim()) {
      nextErrors.dataEntrega = "Informe a data de entrega.";
    }

    if (form.responsavelIds.length === 0) {
      nextErrors.responsavelIds = "Selecione ao menos um responsável.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validar();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      equipeId: form.equipeId,
      categoriaId: form.categoriaId,
      prioridade: form.prioridade,
      dataEntrega: form.dataEntrega,
      horaEntrega: form.horaEntrega.trim() || null,
      responsavelIds: form.responsavelIds,
      status: initialValues?.status ?? "a_fazer",
    });

    onClose();
  }

  return (
    <div
      className="overlay-backdrop fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Adicionar tarefa filha"
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="panel-theme relative w-full max-w-3xl overflow-hidden rounded-[var(--radius-3xl)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header
          className="flex items-start justify-between gap-4 border-b px-4 py-4 md:px-5"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              {initialValues ? "Editar tarefa filha" : "Adicionar tarefa filha"}
            </h2>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-3)" }}
            >
              Cadastre rapidamente uma tarefa vinculada ao objetivo.
            </p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="button-neutral inline-flex h-10 w-10 items-center justify-center rounded-full p-0"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 px-4 py-4 md:px-5 md:py-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--text-2)" }}
              >
                Título <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={(event) => atualizarCampo("titulo", event.target.value)}
                placeholder="Ex.: Definir cronograma com a equipe"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                style={{
                  backgroundColor: "var(--input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-1)",
                }}
              />
              {errors.titulo ? (
                <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
                  {errors.titulo}
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--text-2)" }}
              >
                Descrição
              </label>
              <textarea
                value={form.descricao}
                onChange={(event) =>
                  atualizarCampo("descricao", event.target.value)
                }
                rows={3}
                placeholder="Detalhe rapidamente o que precisa ser feito"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                style={{
                  backgroundColor: "var(--input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-1)",
                }}
              />
            </div>

            <SelectField
              label="Equipe"
              required
              value={form.equipeId}
              onChange={(value) => atualizarCampo("equipeId", value)}
              disabled={bloquearEquipe}
              error={errors.equipeId}
              icon={<Users className="h-4 w-4" />}
            >
              <option value="">Selecione</option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Categoria"
              required
              value={form.categoriaId}
              onChange={(value) => atualizarCampo("categoriaId", value)}
              error={errors.categoriaId}
              icon={<Tag className="h-4 w-4" />}
            >
              <option value="">Selecione</option>
              {categoriasFiltradas.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Prioridade"
              value={form.prioridade}
              onChange={(value) =>
                atualizarCampo("prioridade", value as PrioridadeTarefa)
              }
              icon={<Tag className="h-4 w-4" />}
            >
              {PRIORIDADES.map((prioridade) => (
                <option key={prioridade.value} value={prioridade.value}>
                  {prioridade.label}
                </option>
              ))}
            </SelectField>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-2)" }}
                >
                  Data de entrega <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="date"
                  value={form.dataEntrega}
                  onChange={(event) =>
                    atualizarCampo("dataEntrega", event.target.value)
                  }
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                />
                {errors.dataEntrega ? (
                  <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
                    {errors.dataEntrega}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-2)" }}
                >
                  Hora
                </label>
                <input
                  type="time"
                  value={form.horaEntrega}
                  onChange={(event) =>
                    atualizarCampo("horaEntrega", event.target.value)
                  }
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <TarefaResponsaveisField
                usuarios={usuarios}
                value={form.responsavelIds}
                onChange={(value) => atualizarCampo("responsavelIds", value)}
                disabled={false}
                label="Responsáveis"
                description="Selecione ao menos um responsável para esta tarefa filha."
                minCount={1}
              />
              {errors.responsavelIds ? (
                <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
                  {errors.responsavelIds}
                </p>
              ) : null}
            </div>
          </div>

          <div
            className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="button-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
            >
              {initialValues ? "Salvar filha" : "Adicionar filha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TarefaFilhaQuickModal(props: Props) {
  if (!props.open) {
    return null;
  }

  const modalKey = JSON.stringify({
    equipePredefinidaId: props.equipePredefinidaId ?? null,
    bloquearEquipe: props.bloquearEquipe ?? false,
    initialValues: props.initialValues ?? null,
  });

  return <TarefaFilhaQuickModalContent key={modalKey} {...props} />;
}
