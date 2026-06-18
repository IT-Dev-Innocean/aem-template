export function buildPreviewDocument(content: string): string {
  const trimmed = content.trim();
  const hasHtmlTag = /<\s*html[\s>]/i.test(trimmed);

  if (hasHtmlTag) {
    return trimmed;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: "Segoe UI", system-ui, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
    }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
${trimmed}
</body>
</html>`;
}

export function openPreviewWindow(content: string, title = "HTML Preview") {
  const previewHtml = buildPreviewDocument(content);
  const previewWindow = window.open("", "_blank");

  if (!previewWindow) {
    return false;
  }

  previewWindow.document.open();
  previewWindow.document.write(previewHtml);
  previewWindow.document.close();
  previewWindow.document.title = title;
  return true;
}
