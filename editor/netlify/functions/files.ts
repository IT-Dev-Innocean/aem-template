import type { Handler } from "@netlify/functions";
import rawTemplateData from "./template-data.json";

const templateData = rawTemplateData as {
  tree: Array<{
    name: string;
    path: string;
    type: "file" | "folder";
    children?: Array<unknown>;
  }>;
  files: Record<string, string>;
};

function jsonResponse(status: number, data: unknown) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

function getApiPath(eventPath: string): string {
  return (
    eventPath
      .replace(/^\/\.netlify\/functions\/files/, "")
      .replace(/^\/api\/files/, "") || "/"
  );
}

function isAllowedPath(filePath: string): boolean {
  const root = filePath.split("/")[0];
  return root === "hmid" || root === "kia";
}

export const handler: Handler = async (event) => {
  try {
    const pathname = getApiPath(event.path);

    if (event.httpMethod === "GET" && (pathname === "/" || pathname === "")) {
      return jsonResponse(200, templateData.tree);
    }

    if (event.httpMethod === "GET" && pathname.startsWith("/content")) {
      const filePath = event.queryStringParameters?.path;
      if (!filePath) {
        return jsonResponse(400, { error: "Missing path parameter" });
      }

      if (!isAllowedPath(filePath)) {
        return jsonResponse(403, { error: "Invalid path" });
      }

      const content = templateData.files[filePath];
      if (content === undefined) {
        return jsonResponse(404, { error: "File not found" });
      }

      return jsonResponse(200, { path: filePath, content });
    }

    if (event.httpMethod === "PUT" && pathname.startsWith("/content")) {
      return jsonResponse(503, {
        error:
          "Saving is not supported on the deployed editor. Edit locally with npm run dev, or commit changes via GitHub.",
      });
    }

    return jsonResponse(404, { error: "Not found" });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
