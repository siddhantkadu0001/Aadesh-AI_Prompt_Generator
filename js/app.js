// js/app.js - connects the page to the validator and the prompt builder
import { validateFields } from "./validator.js";
import { buildPrompt } from "./promptBuilder.js";

const $ = (id) => document.getElementById(id);
let templates = null;

function setMessage(text, isError = false) {
  const el = $("message");
  el.textContent = text;
  el.className = isError ? "message error" : "message";
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

async function init() {
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

  renderFields();
}

init();