export const EXCLUDED_TEMPLATE_ROOTS = new Set(["editor", ".github", "node_modules"]);

export function isTemplateRoot(name: string): boolean {
  return Boolean(name) && !name.startsWith(".") && !EXCLUDED_TEMPLATE_ROOTS.has(name);
}
