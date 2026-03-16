"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Tarefa } from "@/types/tarefas/tarefas.types";

type Props = {
  tarefas: Tarefa[];
  onOpenTask?: (taskId: string) => void;
  hideTipoInfo?: boolean;
  showEquipeColuna?: boolean;
  objetivosTituloMap?: Map<string, string>;
};

type SortKey =
  | "prioridade"
  | "titulo"
  | "tipo"
  | "equipe"
  | "categoria"
  | "status"
  | "prazo";

type SortDirection = "asc" | "desc";

type SortRule = {
  key: SortKey;
  direction: SortDirection;
};

function formatarTipo(tipo: Tarefa["tipo"]) {
  if (tipo === "pai") return "Objetivo";
  if (tipo === "filha") return "Tarefa de Objetivo";
  return "Tarefa";
}

function formatarStatus(status: Tarefa["status"]) {
  return status
    .replaceAll("_", " ")
    .split(" ")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

function formatarPrioridade(prioridade: Tarefa["prioridade"]) {
  if (!prioridade) return "Sem prioridade";
  if (prioridade === "media") return "Média";
  return prioridade.charAt(0).toUpperCase() + prioridade.slice(1);
}

function formatarDataPadrao(data?: string | null) {
  if (!data) return "Sem prazo";

  const partes = data.split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return data;

  return date.toLocaleDateString("pt-BR");
}

function classeStatus(status: Tarefa["status"]) {
  switch (status) {
    case "em_atraso":
      return "status-danger";
    case "atencao":
      return "status-warning";
    case "concluida":
      return "status-success";
    case "em_andamento":
      return "status-info";
    case "em_pausa":
      return "status-paused";
    default:
      return "status-neutral";
  }
}

function classePrioridade(prioridade: Tarefa["prioridade"]) {
  switch (prioridade) {
    case "urgente":
      return "status-danger";
    case "alta":
      return "status-warning";
    case "media":
      return "status-info";
    case "baixa":
      return "status-neutral";
    default:
      return "status-neutral";
  }
}

function prioridadePesoAsc(prioridade: Tarefa["prioridade"]) {
  switch (prioridade) {
    case "baixa":
      return 0;
    case "media":
      return 1;
    case "alta":
      return 2;
    case "urgente":
      return 3;
    default:
      return 4;
  }
}

function prazoTimestamp(dataEntrega: string, horaEntrega?: string | null) {
  return new Date(
    horaEntrega ? `${dataEntrega}T${horaEntrega}:00` : `${dataEntrega}T23:59:59`,
  ).getTime();
}

function comparadorTexto(a: string, b: string, direction: SortDirection) {
  return direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
}

function escaparCsv(valor: string) {
  const texto = valor.replaceAll('"', '""');
  return `"${texto}"`;
}

function baixarArquivo(conteudo: string, nomeArquivo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function obterIndiceOrdenacao(sortRules: SortRule[], key: SortKey) {
  return sortRules.findIndex((rule) => rule.key === key);
}

function obterIndicadorDirecao(sortRules: SortRule[], key: SortKey) {
  const regra = sortRules.find((rule) => rule.key === key);
  if (!regra) return "↕";
  return regra.direction === "asc" ? "↑" : "↓";
}

function HeaderButton({
  label,
  columnKey,
  sortRules,
  onSort,
  align = "left",
}: {
  label: string;
  columnKey: SortKey;
  sortRules: SortRule[];
  onSort: (key: SortKey) => void;
  align?: "left" | "center";
}) {
  const indice = obterIndiceOrdenacao(sortRules, columnKey);
  const ativo = indice >= 0;

  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={[
        "inline-flex items-center gap-1.5",
        align === "center" ? "justify-center text-center" : "text-left",
      ].join(" ")}
      style={{
        color: ativo ? "var(--text-1)" : "inherit",
        width: align === "center" ? "100%" : undefined,
      }}
    >
      <span>{label}</span>

      <span
        style={{
          color: ativo ? "var(--text-2)" : "var(--text-4)",
        }}
      >
        {obterIndicadorDirecao(sortRules, columnKey)}
      </span>

      {ativo ? (
        <span
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold"
          style={{
            backgroundColor: "var(--surface-3)",
            color: "var(--text-1)",
            border: "1px solid var(--border)",
          }}
        >
          {indice + 1}
        </span>
      ) : null}
    </button>
  );
}

function compararPorRegra(a: Tarefa, b: Tarefa, rule: SortRule) {
  switch (rule.key) {
    case "prioridade": {
      const resultado =
        prioridadePesoAsc(a.prioridade) - prioridadePesoAsc(b.prioridade);
      return rule.direction === "asc" ? resultado : -resultado;
    }

    case "titulo":
      return comparadorTexto(a.titulo, b.titulo, rule.direction);

    case "tipo":
      return comparadorTexto(
        formatarTipo(a.tipo),
        formatarTipo(b.tipo),
        rule.direction,
      );

    case "equipe": {
      const equipeA = a.tipo === "pai" ? "" : (a.equipe?.nome ?? "");
      const equipeB = b.tipo === "pai" ? "" : (b.equipe?.nome ?? "");
      return comparadorTexto(equipeA, equipeB, rule.direction);
    }

    case "categoria": {
      const categoriaA = a.tipo === "pai" ? "" : (a.categoria?.nome ?? "");
      const categoriaB = b.tipo === "pai" ? "" : (b.categoria?.nome ?? "");
      return comparadorTexto(categoriaA, categoriaB, rule.direction);
    }

    case "status":
      return comparadorTexto(
        formatarStatus(a.status),
        formatarStatus(b.status),
        rule.direction,
      );

    case "prazo":
    default: {
      const resultado =
        prazoTimestamp(a.dataEntrega, a.horaEntrega) -
        prazoTimestamp(b.dataEntrega, b.horaEntrega);
      return rule.direction === "asc" ? resultado : -resultado;
    }
  }
}

export function TarefasTable({
  tarefas,
  onOpenTask,
  hideTipoInfo = false,
  showEquipeColuna = false,
  objetivosTituloMap,
}: Props) {
  const [sortRules, setSortRules] = useState<SortRule[]>([
    { key: "prazo", direction: "asc" },
  ]);

  function handleSort(key: SortKey) {
    setSortRules((current) => {
      const indice = current.findIndex((rule) => rule.key === key);

      if (indice === -1) {
        return [{ key, direction: "asc" }, ...current];
      }

      const regraAtual = current[indice];

      if (regraAtual.direction === "asc") {
        const semAtual = current.filter((rule) => rule.key !== key);
        return [{ key, direction: "desc" }, ...semAtual];
      }

      return current.filter((rule) => rule.key !== key);
    });
  }

  const tarefasOrdenadas = useMemo(() => {
    const lista = [...tarefas];

    lista.sort((a, b) => {
      for (const regra of sortRules) {
        const resultado = compararPorRegra(a, b, regra);
        if (resultado !== 0) return resultado;
      }

      const fallbackPrazo =
        prazoTimestamp(a.dataEntrega, a.horaEntrega) -
        prazoTimestamp(b.dataEntrega, b.horaEntrega);
      if (fallbackPrazo !== 0) return fallbackPrazo;

      return a.titulo.localeCompare(b.titulo);
    });

    return lista;
  }, [tarefas, sortRules]);

  function exportarCsv() {
    const cabecalhos = [
      "Prioridade",
      "Título",
      ...(hideTipoInfo ? [] : ["Tipo"]),
      ...(showEquipeColuna ? ["Equipe"] : []),
      "Categoria",
      "Status",
      "Prazo",
    ];

    const linhas = tarefasOrdenadas.map((tarefa) => {
      const objetivoTitulo =
        tarefa.tipo === "filha" && tarefa.tarefaPaiId
          ? (objetivosTituloMap?.get(tarefa.tarefaPaiId) ?? null)
          : null;

      const tituloComComplemento =
        !hideTipoInfo && tarefa.tipo === "filha" && objetivoTitulo
          ? `${tarefa.titulo} (Vinculada a: ${objetivoTitulo})`
          : tarefa.titulo;

      const prazo = `${formatarDataPadrao(tarefa.dataEntrega)}${
        tarefa.horaEntrega ? ` às ${tarefa.horaEntrega}` : ""
      }`;

      return [
        formatarPrioridade(tarefa.prioridade),
        tituloComComplemento,
        ...(hideTipoInfo ? [] : [formatarTipo(tarefa.tipo)]),
        ...(showEquipeColuna
          ? [tarefa.tipo === "pai" ? "—" : tarefa.equipe?.nome ?? "—"]
          : []),
        tarefa.tipo === "pai" ? "—" : tarefa.categoria?.nome ?? "—",
        formatarStatus(tarefa.status),
        prazo,
      ];
    });

    const csv = [
      cabecalhos.map(escaparCsv).join(","),
      ...linhas.map((linha) =>
        linha.map((item) => escaparCsv(String(item))).join(","),
      ),
    ].join("\n");

    baixarArquivo(csv, "tarefas.csv", "text/csv;charset=utf-8;");
  }

  function baixarPdf() {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const colunas = [
      "Prioridade",
      "Título",
      ...(hideTipoInfo ? [] : ["Tipo"]),
      ...(showEquipeColuna ? ["Equipe"] : []),
      "Categoria",
      "Status",
      "Prazo",
    ];

    const linhas = tarefasOrdenadas.map((tarefa) => {
      const objetivoTitulo =
        tarefa.tipo === "filha" && tarefa.tarefaPaiId
          ? (objetivosTituloMap?.get(tarefa.tarefaPaiId) ?? null)
          : null;

      const tituloComComplemento =
        !hideTipoInfo && tarefa.tipo === "filha" && objetivoTitulo
          ? `${tarefa.titulo}\nVinculada a: ${objetivoTitulo}`
          : tarefa.titulo;

      const prazo = `${formatarDataPadrao(tarefa.dataEntrega)}${
        tarefa.horaEntrega ? ` às ${tarefa.horaEntrega}` : ""
      }`;

      return [
        formatarPrioridade(tarefa.prioridade),
        tituloComComplemento,
        ...(hideTipoInfo ? [] : [formatarTipo(tarefa.tipo)]),
        ...(showEquipeColuna
          ? [tarefa.tipo === "pai" ? "—" : tarefa.equipe?.nome ?? "—"]
          : []),
        tarefa.tipo === "pai" ? "—" : tarefa.categoria?.nome ?? "—",
        formatarStatus(tarefa.status),
        prazo,
      ];
    });

    doc.setFontSize(14);
    doc.text("Tarefas", 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [colunas],
      body: linhas,
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        lineColor: [212, 212, 216],
        lineWidth: 0.2,
        textColor: [17, 17, 17],
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [17, 17, 17],
        fontStyle: "bold",
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 24, halign: "center" },
        1: { cellWidth: 70 },
        ...(hideTipoInfo ? {} : { 2: { cellWidth: 32, halign: "center" } }),
        ...(showEquipeColuna
          ? { [hideTipoInfo ? 2 : 3]: { cellWidth: 34, halign: "center" } }
          : {}),
      },
      margin: { top: 20, right: 10, bottom: 10, left: 10 },
    });

    doc.save("tarefas.pdf");
  }

  const colunas = 5 + (hideTipoInfo ? 0 : 1) + (showEquipeColuna ? 1 : 0);

  return (
    <section className="print-only-table overflow-hidden rounded-3xl surface-1">
      <div
        className="no-print flex flex-wrap items-center justify-end gap-2 border-b px-4 py-3"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface-1)",
        }}
      >
        <button
          type="button"
          onClick={exportarCsv}
          className="button-neutral rounded-xl px-3 py-2 text-sm font-medium"
        >
          Exportar CSV
        </button>

        <button
          type="button"
          onClick={baixarPdf}
          className="button-neutral rounded-xl px-3 py-2 text-sm font-medium"
        >
          Baixar PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table
          className="min-w-full"
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
        >
          <thead className="surface-0">
            <tr
              className="text-left text-[11px] uppercase tracking-[0.14em]"
              style={{ color: "var(--text-4)" }}
            >
              <th className="px-4 py-3 text-center">
                <HeaderButton
                  label="Prioridade"
                  columnKey="prioridade"
                  sortRules={sortRules}
                  onSort={handleSort}
                  align="center"
                />
              </th>

              <th className="px-4 py-3">
                <HeaderButton
                  label="Título"
                  columnKey="titulo"
                  sortRules={sortRules}
                  onSort={handleSort}
                />
              </th>

              {!hideTipoInfo ? (
                <th className="px-4 py-3 text-center">
                  <HeaderButton
                    label="Tipo"
                    columnKey="tipo"
                    sortRules={sortRules}
                    onSort={handleSort}
                    align="center"
                  />
                </th>
              ) : null}

              {showEquipeColuna ? (
                <th className="px-4 py-3 text-center">
                  <HeaderButton
                    label="Equipe"
                    columnKey="equipe"
                    sortRules={sortRules}
                    onSort={handleSort}
                    align="center"
                  />
                </th>
              ) : null}

              <th className="px-4 py-3">
                <HeaderButton
                  label="Categoria"
                  columnKey="categoria"
                  sortRules={sortRules}
                  onSort={handleSort}
                />
              </th>

              <th className="px-4 py-3 text-center">
                <HeaderButton
                  label="Status"
                  columnKey="status"
                  sortRules={sortRules}
                  onSort={handleSort}
                  align="center"
                />
              </th>

              <th className="px-4 py-3">
                <HeaderButton
                  label="Prazo"
                  columnKey="prazo"
                  sortRules={sortRules}
                  onSort={handleSort}
                />
              </th>
            </tr>
          </thead>

          <tbody className="text-sm" style={{ color: "var(--text-2)" }}>
            {tarefasOrdenadas.length === 0 ? (
              <tr>
                <td
                  colSpan={colunas}
                  className="px-4 py-8 text-center"
                  style={{
                    color: "var(--text-3)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  Nenhuma tarefa encontrada.
                </td>
              </tr>
            ) : null}

            {tarefasOrdenadas.map((tarefa, index) => {
              const objetivoTitulo =
                tarefa.tipo === "filha" && tarefa.tarefaPaiId
                  ? (objetivosTituloMap?.get(tarefa.tarefaPaiId) ?? null)
                  : null;

              return (
                <tr
                  key={tarefa.id}
                  className="cursor-pointer transition"
                  onClick={() => onOpenTask?.(tarefa.id)}
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? "var(--surface-1)" : "var(--surface-2)",
                  }}
                >
                  <td
                    className="px-3 py-3 text-center"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-medium ${classePrioridade(
                        tarefa.prioridade,
                      )}`}
                    >
                      {formatarPrioridade(tarefa.prioridade)}
                    </span>
                  </td>

                  <td
                    className="px-3 py-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <div className="max-w-[260px]">
                      <p
                        className="leading-5"
                        style={{
                          color: "var(--text-2)",
                          fontWeight: 500,
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {tarefa.titulo}
                      </p>

                      {!hideTipoInfo &&
                      tarefa.tipo === "filha" &&
                      objetivoTitulo ? (
                        <p
                          className="print-hide mt-1 text-xs"
                          style={{ color: "var(--text-4)" }}
                        >
                          Vinculada a:{" "}
                          <span style={{ color: "var(--text-3)" }}>
                            {objetivoTitulo}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </td>

                  {!hideTipoInfo ? (
                    <td
                      className="px-3 py-3 text-center"
                      style={{
                        color: "var(--text-3)",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      {formatarTipo(tarefa.tipo)}
                    </td>
                  ) : null}

                  {showEquipeColuna ? (
                    <td
                      className="px-3 py-3 text-center"
                      style={{
                        color: "var(--text-3)",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      {tarefa.tipo === "pai" ? "—" : tarefa.equipe?.nome ?? "—"}
                    </td>
                  ) : null}

                  <td
                    className="px-3 py-3"
                    style={{
                      color: "var(--text-3)",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    {tarefa.tipo === "pai" ? "—" : tarefa.categoria?.nome ?? "—"}
                  </td>

                  <td
                    className="px-3 py-3 text-center"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-medium ${classeStatus(
                        tarefa.status,
                      )}`}
                    >
                      {formatarStatus(tarefa.status)}
                    </span>
                  </td>

                  <td
                    className="px-3 py-3"
                    style={{
                      color: "var(--text-2)",
                      borderTop: "1px solid var(--border)",
                      minWidth: "140px",
                    }}
                  >
                    <div className="leading-5">
                      <div>{formatarDataPadrao(tarefa.dataEntrega)}</div>
                      {tarefa.horaEntrega ? (
                        <div style={{ color: "var(--text-4)" }}>
                          às {tarefa.horaEntrega}
                          </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}