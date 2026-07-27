import { deleteAutomation, updateAutomation } from "@/lib/automations";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const automation = await updateAutomation(id, await request.json());
    if (!automation) return Response.json({ error: "Não encontrada." }, { status: 404 });
    return Response.json(automation);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Dados inválidos." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const deleted = await deleteAutomation(id);
  return deleted ? new Response(null, { status: 204 }) : Response.json({ error: "Não encontrada." }, { status: 404 });
}
