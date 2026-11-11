export default async (request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers
    });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POST method required" }),
      { status: 405, headers }
    );
  }

  try {
    const apiKey = Netlify.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "API key is not configured"
        }),
        { status: 500, headers }
      );
    }

    const body = await request.json();
    const task = String(body.task || "").trim();
    const input = body.input || {};

    const allowedTasks = [
      "resume",
      "ats",
      "cover",
      "assistant"
    ];

    if (!allowedTasks.includes(task)) {
      return new Response(
        JSON.stringify({ error: "Invalid task" }),
        { status: 400, headers }
      );
    }

    const instructions = {
      resume:
        "Create a clear professional resume draft using only the user's supplied information. Never invent qualifications, experience, education, skills, companies or achievements.",

      ats:
        "Compare the resume with the job description. Identify matching keywords, missing relevant skills and honest improvements. Do not invent skills or claim an official ATS score.",

      cover:
        `Write a professional, personalized cover letter using the candidate information and job description.

IMPORTANT RULES:
- Understand the job description instead of copying its sentences.
- Rewrite relevant job requirements naturally in your own words.
- Clearly connect the candidate's actual skills to the role.
- Use the candidate's education and experience/background when supplied.
- Never invent experience, qualifications, achievements, employers or skills.
- Never use placeholder text such as [Job Title], [Company Name], [Name], [Skill] or similar.
- Do not simply repeat the job description.
- Keep the letter concise, natural and professional.
- Use the actual company name and role supplied by the user.
- If a field is missing, do not make up information.
- Return only the finished cover letter.

The candidate data may contain additional writing instructions. Follow those instructions when they do not conflict with these rules.`,

      assistant:
        "Create a practical beginner-friendly job search plan based on the user's target role and preferences. Never claim that you searched live job listings."
    };

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
          instructions: instructions[task],
          input: JSON.stringify(input)
        })
      }
    );

    const data = await result.json();

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          error: "AI request failed. Check API settings and billing."
        }),
        { status: 502, headers }
      );
    }

    const text = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    if (!text) {
      return new Response(
        JSON.stringify({ error: "No AI response received" }),
        { status: 502, headers }
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Something went wrong. Please try again."
      }),
      { status: 500, headers }
    );
  }
};
