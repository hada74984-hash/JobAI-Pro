const tabs = document.querySelectorAll(".tab");
tabs.forEach(tab => tab.addEventListener("click", () => {
  tabs.forEach(t => t.classList.toggle("active", t === tab));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === tab.dataset.panel));
}));
const values = {
  resume: () => ({name: val("resumeName"), role: val("resumeRole"), details: val("resumeDetails")}),
  ats: () => ({resume: val("atsResume"), jobDescription: val("atsJob")}),
  cover: () => ({background: val("coverBackground"), role: val("coverRole"), jobDescription: val("coverJob")}),
  assistant: () => ({target: val("jobTarget"), preferences: val("jobPrefs")})
};
function val(id){return document.getElementById(id).value.trim()}
document.querySelectorAll("[data-task]").forEach(button => button.addEventListener("click", async () => {
  const task = button.dataset.task, out = document.getElementById(button.dataset.output), input = values[task]();
  if (!Object.values(input).some(v => v)) { show(out, "Please fill in the fields above first.", true); return; }
  button.disabled = true; button.textContent = "Working on it…";
  show(out, "Connecting securely to AI…", false);
  try {
    const response = await fetch("/.netlify/functions/ai", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({task,input})
    });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || "Request failed. Check your Netlify Function setup and API billing.");
    renderResult(out, data.text || "No text was returned.");
  } catch (e) { show(out, e.message || "Something went wrong.", true); }
  finally { button.disabled = false; button.textContent = ({resume:"Generate resume draft ✦",ats:"Review match & suggest improvements ✦",cover:"Write cover letter ✦",assistant:"Create my job-search plan ✦"})[task]; }
}));
function show(out, text, error){out.hidden=false;out.classList.toggle("error",!!error);out.textContent=text}
function renderResult(out,text){
  out.hidden=false;out.classList.remove("error");out.replaceChildren();
  const tools=document.createElement("div");tools.className="result-tools";
  const copy=document.createElement("button");copy.textContent="Copy text";copy.onclick=async()=>{try{await navigator.clipboard.writeText(text);copy.textContent="Copied!";}catch{copy.textContent="Copy unavailable";}};
  tools.append(copy);const content=document.createElement("div");content.textContent=text;out.append(tools,content);
}
