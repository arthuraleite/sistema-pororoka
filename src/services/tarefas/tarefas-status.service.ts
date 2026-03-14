import type {
  StatusTarefa,
  Tarefa,
  TarefaPai,
//   UUID,
} from "@/types/tarefas/tarefas.types";

const STATUS_REABERTURA_PERMITIDOS: Array<
  Exclude<StatusTarefa, "concluida" | "em_atraso">
> = ["a_fazer", "em_andamento", "atencao", "em_pausa"];

export class TarefasStatusService {
  calcularStatusAutomaticoPorPrazo(params: {
    tarefa: Tarefa;
    agora?: Date;
  }): StatusTarefa {
    const { tarefa } = params;
    const agora = params.agora ?? new Date();

    if (tarefa.status === "concluida") {
      return "concluida";
    }

    if (tarefa.status === "em_pausa") {
      return "em_pausa";
    }

    const prazo = this.combinarDataHoraEntrega(
      tarefa.dataEntrega,
      tarefa.horaEntrega,
    );

    if (prazo.getTime() < agora.getTime()) {
      return "em_atraso";
    }

    return tarefa.status;
  }

  podeMoverPorKanban(params: {
    tarefa: Tarefa;
    novoStatus: StatusTarefa;
  }): boolean {
    const { tarefa, novoStatus } = params;

    if (novoStatus === "em_atraso") {
      return false;
    }

    if (tarefa.status === "concluida") {
      return false;
    }

    if (tarefa.status === "em_atraso") {
      return novoStatus === "concluida";
    }

    if (tarefa.status === "em_pausa") {
      return (
        novoStatus === "a_fazer" ||
        novoStatus === "em_andamento" ||
        novoStatus === "atencao" ||
        novoStatus === "concluida"
      );
    }

    return (
      novoStatus === "a_fazer" ||
      novoStatus === "em_andamento" ||
      novoStatus === "atencao" ||
      novoStatus === "em_pausa" ||
      novoStatus === "concluida"
    );
  }

  validarConclusaoManual(tarefa: Tarefa): void {
    if (tarefa.tipo === "pai") {
      throw new Error(
        "Tarefa-pai não pode ser concluída manualmente. A conclusão é automática pelas filhas.",
      );
    }
  }

  validarStatusInicialTarefaPai(status: StatusTarefa): void {
    if (status === "concluida") {
      throw new Error(
        "Tarefa-pai não pode ser criada já concluída.",
      );
    }
  }

  validarEdicaoStatusTarefaPai(params: {
    tarefaAtual: TarefaPai;
    novoStatus: StatusTarefa;
  }): void {
    const { novoStatus } = params;

    if (novoStatus === "concluida") {
      throw new Error(
        "Tarefa-pai não pode ser marcada manualmente como concluída.",
      );
    }

    if (novoStatus === "em_atraso") {
      throw new Error(
        "Tarefa-pai não deve receber status em_atraso manualmente.",
      );
    }
  }

  validarReabertura(novoStatus: string): asserts novoStatus is Exclude<
    StatusTarefa,
    "concluida" | "em_atraso"
  > {
    if (
      !STATUS_REABERTURA_PERMITIDOS.includes(
        novoStatus as Exclude<StatusTarefa, "concluida" | "em_atraso">,
      )
    ) {
      throw new Error("Status inválido para reabertura.");
    }
  }

  prepararStatusParaPersistencia(params: {
    tarefa: Tarefa;
    novoStatus: StatusTarefa;
    origem: "manual" | "kanban" | "reabertura" | "automatica";
  }): {
    status: StatusTarefa;
    dataConclusao: string | null;
  } {
    const { tarefa, novoStatus, origem } = params;

    if (origem === "kanban" && !this.podeMoverPorKanban({ tarefa, novoStatus })) {
      throw new Error("Movimento de kanban não permitido para esta tarefa.");
    }

    if (origem !== "automatica" && novoStatus === "concluida") {
      this.validarConclusaoManual(tarefa);
    }

    if (origem === "reabertura") {
      this.validarReabertura(novoStatus);

      return {
        status: novoStatus,
        dataConclusao: null,
      };
    }

    if (novoStatus === "concluida") {
      return {
        status: "concluida",
        dataConclusao: new Date().toISOString(),
      };
    }

    return {
      status: novoStatus,
      dataConclusao: null,
    };
  }

  ordenarChecklistFilhas<T extends Tarefa>(tarefas: T[]): T[] {
    return [...tarefas].sort((a, b) => {
      const pesoA = this.pesoChecklist(a);
      const pesoB = this.pesoChecklist(b);

      if (pesoA !== pesoB) return pesoA - pesoB;

      const prazoA = this.combinarDataHoraEntrega(a.dataEntrega, a.horaEntrega);
      const prazoB = this.combinarDataHoraEntrega(b.dataEntrega, b.horaEntrega);

      return prazoA.getTime() - prazoB.getTime();
    });
  }

  private pesoChecklist(tarefa: Tarefa): number {
    if (tarefa.status === "em_atraso") return 0;
    if (tarefa.status !== "concluida") return 1;
    return 2;
  }

  private combinarDataHoraEntrega(data: string, hora: string | null): Date {
    const valor = hora ? `${data}T${hora}:00` : `${data}T23:59:59`;
    return new Date(valor);
  }
}