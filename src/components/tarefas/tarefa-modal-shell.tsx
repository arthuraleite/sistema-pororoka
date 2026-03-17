"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  main: ReactNode;
  sidebar: ReactNode;
  footer?: ReactNode;
  mainClassName?: string;
  sidebarClassName?: string;
};

export function TarefaModalShell({
  open,
  title,
  subtitle,
  onClose,
  main,
  sidebar,
  footer,
  mainClassName,
  sidebarClassName,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="overlay-backdrop fixed inset-0 z-[90] flex items-center justify-center p-3 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="panel-theme relative flex h-[92vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-[var(--radius-3xl)] shadow-2xl">
        <header
          className="flex items-start justify-between gap-4 border-b px-4 py-4 md:px-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0">
            <h2
              className="truncate text-lg font-semibold md:text-xl"
              style={{ color: "var(--text-1)" }}
            >
              {title}
            </h2>

            {subtitle ? (
              <p
                className="mt-1 max-w-3xl text-sm leading-6"
                style={{ color: "var(--text-3)" }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="button-neutral inline-flex h-10 w-10 items-center justify-center rounded-full p-0"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_380px]">
            <section
              className={[
                "min-h-0 overflow-y-auto px-4 py-4 md:px-6 md:py-5",
                mainClassName ?? "",
              ].join(" ")}
            >
              {main}
            </section>

            <aside
              className={[
                "min-h-0 overflow-y-auto border-t px-4 py-4 md:px-5 md:py-5 xl:border-l xl:border-t-0",
                sidebarClassName ?? "",
              ].join(" ")}
              style={{ borderColor: "var(--border)" }}
            >
              {sidebar}
            </aside>
          </div>
        </div>

        {footer ? (
          <footer
            className="border-t px-4 py-3 md:px-6"
            style={{ borderColor: "var(--border)" }}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}