import { authenticate, body, failure, ApiError } from "@/lib/server";
import { stateSchema } from "@/lib/schemas";
import { eligibility } from "@/lib/training";
export async function GET(req: Request) {
  try {
    const { db, user } = await authenticate(req);
    const { data, error } = await db
      .from("user_workspaces")
      .select("state,revision")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (data && !stateSchema.safeParse(data.state).success)
      throw new ApiError(
        "Registros incompatíveis. Exporte ou restaure o banco antes de continuar.",
        422,
      );
    return Response.json(data ?? { state: null, revision: 0 }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    const { db } = await authenticate(req);
    const input = await body(req);
    const parsed = stateSchema.safeParse(input.state);
    if (!parsed.success)
      throw new ApiError(
        "Há campos inválidos. Confira sua avaliação e registros.",
      );
    if (
      parsed.data.plan &&
      (!parsed.data.assessment || eligibility(parsed.data.assessment))
    )
      throw new ApiError(
        "Plano bloqueado: revise a avaliação com um profissional.",
      );
    if (!Number.isInteger(input.revision) || input.revision < 0)
      throw new ApiError("Versão inválida.");
    const { data, error } = await db.rpc("save_workspace", {
      p_state: parsed.data,
      p_revision: input.revision,
    });
    if (error) {
      if (error.message.includes("conflict"))
        throw new ApiError(
          "Dados alterados em outra janela. Recarregue antes de salvar.",
          409,
        );
      throw error;
    }
    return Response.json({ revision: data });
  } catch (e) {
    return failure(e);
  }
}
