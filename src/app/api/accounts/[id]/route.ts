import { query } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = id;

    if (!accountId) {
      return Response.json(
        { error: "ID da conta é obrigatório" },
        { status: 400 }
      );
    }

    // Verifica se a conta existe
    const existing = await query<{ id: string }>(
      `SELECT id FROM instagram_accounts WHERE id = $1`,
      [accountId]
    );

    if (existing.rows.length === 0) {
      return Response.json(
        { error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    // Conta de quantas automações usam essa conta
    const automations = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM automations WHERE account_id = $1`,
      [accountId]
    );

    const automationCount = parseInt(automations.rows[0]?.count || "0");

    // Se houver automações usando essa conta, delete-as
    if (automationCount > 0) {
      await query(`DELETE FROM automations WHERE account_id = $1`, [accountId]);
    }

    // Delete a conta
    await query(`DELETE FROM instagram_accounts WHERE id = $1`, [accountId]);

    return Response.json({
      success: true,
      message: `Conta desconectada com sucesso${automationCount > 0 ? `. ${automationCount} automação(ões) associada(s) foi/foram deletada(s).` : "."}`,
      deletedAutomations: automationCount,
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return Response.json(
      { error: "Erro ao desconectar conta" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = id;

    // Get account details and check for associated automations
    const account = await query<{
      id: string;
      instagram_username: string;
      instagram_name: string;
      connected_at: string;
    }>(`SELECT id, instagram_username, instagram_name, connected_at FROM instagram_accounts WHERE id = $1`, [
      accountId,
    ]);

    if (account.rows.length === 0) {
      return Response.json(
        { error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    const automations = await query<{ id: string; name: string }>(
      `SELECT id, name FROM automations WHERE account_id = $1`,
      [accountId]
    );

    return Response.json({
      account: account.rows[0],
      automations: automations.rows,
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return Response.json(
      { error: "Erro ao buscar conta" },
      { status: 500 }
    );
  }
}
