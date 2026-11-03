
const tabs = document.querySelectorAll(".tab");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.toggle("active", t === tab));

    document.querySelectorAll(".panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === tab.dataset.panel);
    });
  });
});

function val(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

const values = {
  resume: () => ({
    name: val("resumeName"),
    role: val("resumeRole"),
    details: val("resumeDetails")
  }),

  ats: () => ({
    resume: val("atsResume"),
    jobDescription: val("atsJob")
  }),

  cover: () => ({
    background: val("coverBackground"),
    role: val("coverRole"),
    jobDescription: val("coverJob"),
    writingInstructions: [
      "Write a professional, natural and personalized cover letter.",
      "Understand the job description; do not copy it word for word.",
      "Explain how the candidate's skills relate to the role.",
      "Use only details supplied by the candidate.",
      "Never invent qualifications, education or work experience.",
      "Do not include placeholder text such as [Job Title].",
      "Use clear paragraphs and a professional closing."
    ].join(" ")
  }),

  assistant: () => ({
    target: val("jobTarget"),
    preferences: val("jobPrefs")
  })
};

const buttonLabels = {
  resume: "Generate resume draft ✦",
  ats: "Review match & suggest improvements ✦",
  cover: "Write cover letter ✦",
  assistant: "Create my job-search plan ✦"
};

document.querySelectorAll("[data-task]").forEach(button => {
  button.addEventListener("click", async () => {
    const task = button.dataset.task;
    const output = document.getElementById(button.dataset.output);

    if (!output || !values[task]) return;

    const input = values[task]();

    if (!Object.values(input).some(value => value.trim())) {
      show(output, "Please fill in the fields above first.", true);
      return;
    }

    button.disabled = true;
    button.textContent = "Working on it…";
    show(output, "Connecting securely to AI…", false);

    try {
      const response = await fetch("/.netlify/functions/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ task, input })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "AI request failed. Check your Netlify Function setup."
        );
      }

      if (!data.text || typeof data.text !== "string") {
        throw new Error("AI did not return a valid response.");
      }

      renderResult(output, data.text);

    } catch (error) {
      show(output, error.message || "Something went wrong.", true);

    } finally {
      button.disabled = false;
      button.textContent = buttonLabels[task] || "Generate ✦";
    }
  });
});

function show(output, message, isError) {
  output.hidden = false;
  output.classList.toggle("error", Boolean(isError));
  output.textContent = message;
}

function renderResult(output, text) {
  output.hidden = false;
  output.classList.remove("error");
  output.replaceChildren();

  const tools = document.createElement("div");
  tools.className = "result-tools";

  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "Copy text";

  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      copy.textContent = "Copied!";
    } catch {
      copy.textContent = "Copy unavailable";
    }
  });

  const content = document.createElement("div");
  content.textContent = text;

  tools.append(copy);
  output.append(tools, content);
}
