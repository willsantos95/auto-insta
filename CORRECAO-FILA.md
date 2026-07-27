# Correção da fila — projeto pessoal

## Causa

O serviço web iniciava apenas o Next.js. O worker contínuo existia no código, mas dependia de um segundo serviço no EasyPanel. Assim, itens com atraso podiam ficar `pending` até outro webhook chegar.

Também havia uma ambiguidade: uma resposta em texto à DM de boas-vindas podia ser tratada como uma nova automação de DM, em vez de confirmar a automação anterior.

## Correções

- Web e worker passam a iniciar juntos no mesmo container.
- Worker verifica a fila em aproximadamente 500 ms quando está ocioso.
- O webhook tenta enviar imediatamente um item já vencido antes de responder.
- Respostas à última DM de boas-vindas priorizam o envio dos follow-ups.
- A fila continua atômica e mantém limite de envio e janela de 24 horas.

## Deploy

Substitua os arquivos do repositório pelo conteúdo desta versão e implante novamente. Não altere as variáveis de ambiente e não execute nova migração manual.
