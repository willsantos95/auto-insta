import { createAutomation, listAutomations } from "@/lib/automations";

export async function GET() {
  return Response.json(await listAutomations());
}

export async function POST(request: Request) {
  try {
    const automation = await createAutomation(await request.json());
    return Response.json(automation, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Dados inválidos." }, { status: 400 });
  }
}
