export const EXCLUDED_ROOT_ENTRIES = new Set(["editor", ".github", "node_modules"]);

const EDITABLE_EXTENSIONS = new Set([
  "css",
  "htm",
  "html",
  "js",
  "json",
  "jsx",
  "md",
  "ts",
  "tsx",
  "txt",
]);

export function isExcludedRoot(name: string): boolean {
  return !name || name.startsWith(".") || EXCLUDED_ROOT_ENTRIES.has(name);
}

export function isEditableFile(name: string): boolean {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) {
    return false;
  }

  const ext = name.slice(dotIndex + 1).toLowerCase();
  return EDITABLE_EXTENSIONS.has(ext);
}

export function isAllowedFilePath(filePath: string): boolean {
  const segments = filePath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return false;
  }

  const firstSegment = segments[0];
  if (isExcludedRoot(firstSegment)) {
    return false;
  }

  if (segments.length === 1) {
    return isEditableFile(firstSegment);
  }

  return true;
}

/** @deprecated Use isExcludedRoot / isAllowedFilePath instead */
export function isTemplateRoot(name: string): boolean {
  return !isExcludedRoot(name);
}
