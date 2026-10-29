export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POST method required" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const apiKey = Netlify.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const body = await request.json();
    const task = String(body.task || "").trim();
    const input = body.input || {};

    const prompt = `You are JobAI Pro, a helpful career assistant.
Task: ${task}
User information:
${JSON.stringify(input, null, 2)}

Help the user with this career task. Do not invent qualifications or work experience.
Return a clear, useful response.`;

    if (!task || !Object.keys(input).length) {
      return new Response(
        JSON.stringify({ error: "Task and input are required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const result = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: prompt
        })
      }
    );

    const data = await result.json();

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: "AI request failed. Check API settings and billing."
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const text = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return new Response(
      JSON.stringify({ text }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
