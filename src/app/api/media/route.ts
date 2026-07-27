import { fetchMedia } from "@/lib/meta";

export async function GET() {
  try {
    return Response.json(await fetchMedia());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao buscar mídias." }, { status: 502 });
  }
}
