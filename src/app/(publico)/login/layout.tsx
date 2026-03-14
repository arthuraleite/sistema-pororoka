import type { ReactNode } from "react";

type PropriedadesLayoutPublico = {
  children: ReactNode;
};

export default function LayoutPublico({
  children,
}: PropriedadesLayoutPublico) {
  return <>{children}</>;
}