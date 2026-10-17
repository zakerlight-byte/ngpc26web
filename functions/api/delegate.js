export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = typeof body?.name === "string"
    ? body.name.trim().replace(/\s+/g, " ")
    : "";

  if (!name || name.length > 100) {
    return Response.json({ error: "Enter a valid name." }, { status: 400 });
  }

  try {
    const { results = [] } = await env.DB
      .prepare(`
        SELECT name, grade, committee, country
        FROM delegates
        WHERE name = ? COLLATE NOCASE
        LIMIT 2
      `)
      .bind(name)
      .all();

    if (results.length === 0) {
      return Response.json({ error: "No matching delegate found." }, { status: 404 });
    }
    if (results.length > 1) {
      return Response.json({ error: "More than one delegate has this name." }, { status: 409 });
    }

    return Response.json(results[0], {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return Response.json({ error: "Delegate lookup is unavailable." }, { status: 500 });
  }
}
