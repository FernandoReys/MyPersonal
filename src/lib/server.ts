import { createClient } from "@supabase/supabase-js";
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function authenticate(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ApiError("Entre na sua conta.", 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new ApiError("Supabase ainda não configurado.", 503);
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new ApiError("Sessão inválida.", 401);
  return { db, user: data.user };
}
export function failure(e: unknown) {
  return Response.json(
    {
      error:
        e instanceof ApiError
          ? e.message
          : "Não foi possível concluir. Tente novamente.",
    },
    {
      status: e instanceof ApiError ? e.status : 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export async function body(req: Request) {
  const raw = await req.text();
  if (raw.length > 1_000_000)
    throw new ApiError("Dados excedem o limite.", 413);
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError("JSON inválido.");
  }
}
