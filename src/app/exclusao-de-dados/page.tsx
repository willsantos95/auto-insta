import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export default function DataDeletionPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 md:p-12">
      <h1 className="text-3xl font-bold">Solicitação de Exclusão de Dados</h1>
      <div className="mt-8 space-y-5 leading-7 text-zinc-300">
        <p>Para solicitar a exclusão dos dados associados à sua interação com o perfil @poraodanet, envie um e-mail para {env.PRIVACY_CONTACT_EMAIL}.</p>
        <p>Informe seu nome de usuário do Instagram e escreva “Exclusão de dados do Instagram Auto” no assunto. Após validar a solicitação, removeremos os registros de contato, fila e eventos associados, salvo quando a retenção for necessária para cumprir uma obrigação legal.</p>
        <p>A confirmação será enviada pelo mesmo canal de contato usado na solicitação.</p>
      </div>
    </main>
  );
}
