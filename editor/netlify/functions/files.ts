import type { Handler } from "@netlify/functions";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFileTree,
  readFileContent,
} from "../../shared/file-api-core.ts";

const templatesRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "templates",
);

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

export const handler: Handler = async (event) => {
  try {
    const pathname = getApiPath(event.path);

    if (event.httpMethod === "GET" && (pathname === "/" || pathname === "")) {
      return jsonResponse(200, buildFileTree(templatesRoot));
    }

    if (event.httpMethod === "GET" && pathname.startsWith("/content")) {
      const filePath = event.queryStringParameters?.path;
      if (!filePath) {
        return jsonResponse(400, { error: "Missing path parameter" });
      }

      const result = readFileContent(templatesRoot, filePath);
      if (!result) {
        return jsonResponse(404, { error: "File not found" });
      }

      return jsonResponse(200, result);
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
