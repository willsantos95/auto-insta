import { spawn } from "node:child_process";
import process from "node:process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = new Set();
let stopping = false;

function startProcess(label, args) {
  const child = spawn(npmCommand, args, {
    stdio: "inherit",
    env: process.env,
  });

  children.add(child);
  child.on("exit", (code, signal) => {
    children.delete(child);
    if (stopping) return;

    console.error(
      `[startup] ${label} encerrou inesperadamente (code=${code ?? "null"}, signal=${signal ?? "null"}).`,
    );
    shutdown(code && code > 0 ? code : 1);
  });

  return child;
}

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;

  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }

  const forceTimer = setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill("SIGKILL");
    }
  }, 8_000);
  forceTimer.unref();
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`[startup] Recebido ${signal}. Encerrando web e worker...`);
    shutdown(0);
  });
}

console.log("[startup] Iniciando aplicação web e worker da fila no mesmo serviço...");
startProcess("worker", ["run", "worker"]);
startProcess("web", ["run", "start:web"]);
