import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client scoped to the caller's own session — used only to identify who's calling.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) return json({ error: "Invalid session" }, 401);

    // Service-role client — bypasses RLS, never exposed to the browser.
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: isAdmin, error: roleErr } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) return json({ error: "Admins only" }, 403);

    const { email, password, full_name, role } = await req.json();
    if (!email || !password) return json({ error: "email and password are required" }, 400);
    if (String(password).length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "" },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message || "Failed to create user" }, 400);
    }

    if (role === "admin") {
      const { error: grantErr } = await adminClient
        .from("user_roles")
        .insert({ user_id: created.user.id, role: "admin" });
      if (grantErr) return json({ error: `User created but role grant failed: ${grantErr.message}` }, 500);
    }

    return json({ user: { id: created.user.id, email: created.user.email } }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
