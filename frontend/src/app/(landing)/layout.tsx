import type { Metadata } from "next";
import "../../styles/main.css";

export const metadata: Metadata = {
  title: "IAI Soluções - Inteligência Artificial e Vendas via WhatsApp",
  description: "Automatize seu atendimento e escale suas vendas no WhatsApp com a IAI Soluções. Plataforma omnichannel com múltiplos atendentes, CRM Kanban e Inteligência Artificial avançada.",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="landing-layout-wrapper">
      {children}
    </div>
  );
}
