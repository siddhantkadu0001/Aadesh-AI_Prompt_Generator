export function buildPrompt(patterns, patternName, variables, systemOverride = null) {
  const pattern = patterns[patternName];
  if (!pattern) {
    throw new Error(
      `Unknown pattern: ${patternName}. Available: ${Object.keys(patterns).join(", ")}`
    );
  }

  const missing = pattern.variables.filter((v) => !(v in variables));
  if (missing.length > 0) {
    throw new Error(`Missing variables for ${patternName}: ${missing.join(", ")}`);
  }

  const rendered = pattern.template.replace(/\{(\w+)\}/g, (match, name) =>
    pattern.variables.includes(name) ? String(variables[name] ?? "").trim() : match
  );

  const system = systemOverride || `You are an AI assistant using the ${pattern.name}.`;

  return {
    system,
    user: rendered,
    temperature: pattern.temperature,
    pattern: patternName,
    metadata: {
      description: pattern.description,
      variablesUsed: Object.keys(variables),
    },
  };
}

export function buildMultiTurn(patterns, patternName, turns, systemOverride = null) {
  const pattern = patterns[patternName];
  if (!pattern) {
    throw new Error(`Unknown pattern: ${patternName}`);
  }

  const system = systemOverride || `You are an AI assistant using the ${pattern.name}.`;

  const messages = [{ role: "system", content: system }];
  for (const [role, content] of turns) {
    messages.push({ role, content });
  }

  return { messages, temperature: pattern.temperature, pattern: patternName };
}