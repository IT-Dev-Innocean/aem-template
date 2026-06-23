import type { Handler } from "@netlify/functions";
import {
  fetchGitHubFileContent,
  fetchGitHubFileTree,
} from "../../shared/github-file-api.ts";
import { isAllowedFilePath } from "../../shared/template-roots.ts";

function jsonResponse(status: number, data: unknown) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
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
  return isAllowedFilePath(filePath);
}

export const handler: Handler = async (event) => {
  try {
    const pathname = getApiPath(event.path);

    if (event.httpMethod === "GET" && (pathname === "/" || pathname === "")) {
      const tree = await fetchGitHubFileTree();
      return jsonResponse(200, tree);
    }

    if (event.httpMethod === "GET" && pathname.startsWith("/content")) {
      const filePath = event.queryStringParameters?.path;
      if (!filePath) {
        return jsonResponse(400, { error: "Missing path parameter" });
      }

      if (!isAllowedPath(filePath)) {
        return jsonResponse(403, { error: "Invalid path" });
      }

      try {
        const content = await fetchGitHubFileContent(filePath);
        return jsonResponse(200, { path: filePath, content });
      } catch {
        return jsonResponse(404, { error: "File not found" });
      }
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
