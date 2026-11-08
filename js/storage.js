// js/storage.js - saves prompt history in the browser (localStorage)
const HISTORY_KEY = "apg_history";
const MAX_ITEMS = 50;

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    /* storage may be blocked; the app still works without it */
  }
}

export function getHistory() {
  return read();
}

// entry: { patternKey, patternName, fields, prompt, system }
export function saveToHistory(entry) {
  const items = read();
  items.unshift({ id: Date.now(), date: new Date().toISOString(), ...entry });
  write(items.slice(0, MAX_ITEMS));
}

export function deleteFromHistory(id) {
  write(read().filter((item) => item.id !== id));
}