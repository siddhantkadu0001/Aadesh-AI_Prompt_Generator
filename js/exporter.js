// js/app.js - connects the page to the validator, prompt builder, history and export
import { validateFields } from "./validator.js";
import { buildPrompt } from "./promptBuilder.js";
import { getHistory, saveToHistory, deleteFromHistory } from "./storage.js";
import { downloadText } from "./exporter.js";

const $ = (id) => document.getElementById(id);
let templates = null;

function setMessage(text, isError = false) {
  const el = $("message");
  el.textContent = text;
  el.className = isError ? "message error" : "message";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("themeToggle").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  try {
    localStorage.setItem("apg_theme", theme);
  } catch {
    /* storage may be blocked; the theme still changes */
  }
}

// Creates one input box for each variable of the selected pattern.
function renderFields() {
  const pattern = templates.patterns[$("pattern").value];
  $("patternDescription").textContent = pattern.description;

  const container = $("fields");
  container.innerHTML = "";

  for (const name of pattern.variables) {
    const label = document.createElement("label");
    label.htmlFor = `field-${name}`;
    label.textContent = name.replace(/_/g, " ");

    const input = document.createElement("textarea");
    input.id = `field-${name}`;
    input.rows = 2;
    input.maxLength = 1000;

    container.append(label, input);
  }
}

function readValues(pattern) {
  const values = {};
  for (const name of pattern.variables) {
    values[name] = $(`field-${name}`).value;
  }
  return values;
}

function generate() {
  const patternName = $("pattern").value;
  const pattern = templates.patterns[patternName];
  const values = readValues(pattern);

  const check = validateFields(pattern, values, templates.unsafeKeywords);
  if (!check.ok) {
    setMessage(check.errors.join(" "), true);
    return;
  }

  try {
    const override = $("systemOverride").value.trim() || null;
    const result = buildPrompt(templates.patterns, patternName, values, override);

    $("output").value = result.user;
    $("systemOutput").value = result.system;
    $("temperature").textContent = `Recommended temperature: ${result.temperature}`;
    setMessage(`${pattern.name} prompt generated.`);
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function copyPrompt() {
  const text = $("output").value;
  if (!text) {
    setMessage("Nothing to copy yet.", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setMessage("Copied to clipboard.");
  } catch {
    $("output").select();
    setMessage("Press Ctrl+C to copy the selected text.");
  }
}

// ---------- History ----------

function saveCurrent() {
  const text = $("output").value;
  if (!text) {
    setMessage("Generate a prompt first.", true);
    return;
  }
  const patternKey = $("pattern").value;
  const pattern = templates.patterns[patternKey];

  saveToHistory({
    patternKey,
    patternName: pattern.name,
    fields: readValues(pattern),
    prompt: text,
    system: $("systemOutput").value,
  });
  renderHistory();
  setMessage("Saved to history.");
}

function loadFromHistory(item) {
  const pattern = templates.patterns[item.patternKey];
  if (!pattern) {
    setMessage("That pattern no longer exists.", true);
    return;
  }

  $("pattern").value = item.patternKey;
  renderFields();
  for (const name of pattern.variables) {
    $(`field-${name}`).value = item.fields?.[name] ?? "";
  }
  $("output").value = item.prompt;
  $("systemOutput").value = item.system ?? "";
  $("temperature").textContent = `Recommended temperature: ${pattern.temperature}`;
  setMessage("Loaded from history.");
}

function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";

  const items = getHistory();
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No saved prompts yet.";
    list.appendChild(empty);
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "history-item";

    // Show the pattern name and the first filled field as a short title.
    const firstValue = Object.values(item.fields ?? {}).find((v) => v && v.trim()) ?? "";
    const short = firstValue.length > 50 ? firstValue.slice(0, 50) + "…" : firstValue;
    const title = document.createElement("strong");
    title.textContent = `${item.patternName}: ${short}`;

    const useBtn = document.createElement("button");
    useBtn.type = "button";
    useBtn.textContent = "Use";
    useBtn.addEventListener("click", () => loadFromHistory(item));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "secondary";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      deleteFromHistory(item.id);
      renderHistory();
    });

    row.append(title, useBtn, delBtn);
    list.appendChild(row);
  }
}

// ---------- Export ----------

function exportAs(kind) {
  const text = $("output").value;
  if (!text) {
    setMessage("Generate a prompt first.", true);
    return;
  }
  if (kind === "md") {
    downloadText("prompt.md", "```\n" + text + "\n```\n");
  } else {
    downloadText("prompt.txt", text);
  }
  setMessage(`Exported as prompt.${kind}.`);
}

// ---------- Start ----------

async function init() {
  // Theme first, so dark mode works even if the templates fail to load.
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem("apg_theme") || "light";
  } catch {
    /* ignore */
  }
  applyTheme(savedTheme);
  $("themeToggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  try {
    const res = await fetch("data/templates.json");
    templates = await res.json();
  } catch {
    setMessage("Could not load templates. Open this page with Live Server.", true);
    return;
  }

  const select = $("pattern");
  for (const [key, pattern] of Object.entries(templates.patterns)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = pattern.name;
    select.appendChild(option);
  }

  select.addEventListener("change", renderFields);
  $("generateBtn").addEventListener("click", generate);
  $("copyBtn").addEventListener("click", copyPrompt);
  $("saveBtn").addEventListener("click", saveCurrent);
  $("exportTxtBtn").addEventListener("click", () => exportAs("txt"));
  $("exportMdBtn").addEventListener("click", () => exportAs("md"));

  renderFields();
  renderHistory();
}

init();