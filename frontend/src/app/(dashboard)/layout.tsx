import type { Metadata } from "next";
import "../../styles/app.css";

export const metadata: Metadata = {
  title: "IAI Soluções - Painel de Controle",
  description: "Painel administrativo para controle de agentes autônomos de IA e CRM no WhatsApp.",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dashboard-layout-wrapper">
      {children}
    </div>
  );
}
