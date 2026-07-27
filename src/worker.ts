import { env } from "./lib/env";
import { processOne } from "./lib/queue";
import { pool } from "./lib/db";

let stopped = false;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Worker iniciado. Limite:", env.MAX_MESSAGES_PER_HOUR, "mensagens/hora");
  while (!stopped) {
    try {
      const didWork = await processOne();
      await sleep(didWork ? env.WORKER_INTERVAL_MS : 2_000);
    } catch (error) {
      console.error("Erro no ciclo do worker:", error);
      await sleep(5_000);
    }
  }
  await pool.end();
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`Recebido ${signal}. Encerrando worker...`);
    stopped = true;
  });
}

run().catch((error) => {
  console.error("Worker encerrado por erro fatal:", error);
  process.exit(1);
});
