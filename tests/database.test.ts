import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const first = "11111111-1111-4111-8111-111111111111";
const second = "22222222-2222-4222-8222-222222222222";
test("migration: user isolation, conflict control, quota and cascading deletion", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema auth to authenticated,anon;
   grant execute on function auth.uid() to authenticated,anon;
   insert into auth.users values('${first}'),('${second}');`);
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub='${first}';`,
    );
    const state = JSON.stringify({
      assessment: null,
      plan: null,
      sessions: [],
      measurements: [],
      messages: [],
    });
    let result = await db.query<{ revision: number }>(
      "select public.save_workspace($1::jsonb,0) as revision",
      [state],
    );
    assert.equal(result.rows[0].revision, 1);
    await assert.rejects(
      () => db.query("select public.save_workspace($1::jsonb,0)", [state]),
      /conflict/,
    );
    result = await db.query(
      "select public.save_workspace($1::jsonb,1) as revision",
      [state],
    );
    assert.equal(result.rows[0].revision, 2);
    await db.exec(`set request.jwt.claim.sub='${second}';`);
    assert.equal(
      (await db.query("select * from public.user_workspaces")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.profiles")).rows.length,
      0,
    );
    await assert.rejects(
      () => db.query("update public.user_workspaces set revision=99"),
      /permission denied/,
    );
    for (let i = 0; i < 20; i++)
      assert.equal(
        (
          await db.query<{ allowed: boolean }>(
            "select public.consume_ai_quota() as allowed",
          )
        ).rows[0].allowed,
        true,
      );
    assert.equal(
      (
        await db.query<{ allowed: boolean }>(
          "select public.consume_ai_quota() as allowed",
        )
      ).rows[0].allowed,
      false,
    );
    await db.exec("reset role;");
    await db.query("delete from auth.users where id=$1", [first]);
    assert.equal(
      (await db.query("select * from public.user_workspaces")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
