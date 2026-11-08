export const MAX_LENGTH = 1000;

export function validateFields(pattern, values, unsafeKeywords = []) {
  const errors = [];

  for (const name of pattern.variables) {
    const value = (values[name] ?? "").toString().trim();

    if (value === "") {
      errors.push(`Please fill in: ${name}`);
      continue;
    }
    if (value.length > MAX_LENGTH) {
      errors.push(`"${name}" is too long (max ${MAX_LENGTH} characters).`);
    }
    const lower = value.toLowerCase();
    if (unsafeKeywords.some((k) => lower.includes(k))) {
      errors.push(`"${name}" contains blocked content. Please rephrase it.`);
    }
  }

  return { ok: errors.length === 0, errors };
}