import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 md:p-12">
      <h1 className="text-3xl font-bold">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-zinc-500">Última atualização: 27 de julho de 2026</p>
      <div className="mt-8 space-y-5 leading-7 text-zinc-300">
        <p>O Instagram Auto do perfil @poraodanet processa eventos necessários para responder a comentários e mensagens iniciadas pelo próprio usuário no Instagram.</p>
        <p>Podemos armazenar o identificador do Instagram, nome de usuário quando disponibilizado, horários de interação, automação acionada e registros técnicos de entrega. Não vendemos esses dados e não realizamos disparos para pessoas que não iniciaram uma interação.</p>
        <p>O token de acesso da conta profissional é armazenado de forma criptografada. O sistema utiliza HTTPS e restringe o acesso ao banco de dados ao servidor da aplicação.</p>
        <p>Os dados são usados somente para executar as automações configuradas, prevenir envios duplicados, respeitar a janela de mensagens e investigar falhas técnicas.</p>
        <p>Para solicitar acesso, correção ou exclusão, envie um e-mail para {env.PRIVACY_CONTACT_EMAIL}.</p>
      </div>
    </main>
  );
}
