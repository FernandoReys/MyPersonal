import { createClient } from "@supabase/supabase-js";
import { authenticate, body, failure, ApiError } from "@/lib/server";
export async function DELETE(req: Request) {
  try {
    const { user } = await authenticate(req);
    const input = await body(req);
    if (input.confirmation !== "EXCLUIR")
      throw new ApiError("Digite EXCLUIR para confirmar.");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new ApiError(
        "Exclusão de conta aguarda configuração do administrador.",
        503,
      );
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
