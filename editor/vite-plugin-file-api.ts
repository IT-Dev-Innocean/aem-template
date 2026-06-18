import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  buildFileTree,
  readFileContent,
  writeFileContent,
  type FileNode,
} from "./shared/file-api-core.ts";

export type { FileNode };

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function attachFileApi(
  server: {
    middlewares: {
      use: (
        path: string,
        handler: (
          req: IncomingMessage,
          res: ServerResponse,
          next: (error?: unknown) => void,
        ) => void,
      ) => void;
    };
  },
  projectRoot: string,
) {
  server.middlewares.use("/api/files", async (req, res, next) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const pathname = decodeURIComponent(url.pathname);

      if (req.method === "GET" && (pathname === "/" || pathname === "")) {
        sendJson(res, 200, buildFileTree(projectRoot));
        return;
      }

      if (req.method === "GET" && pathname.startsWith("/content")) {
        const filePath = url.searchParams.get("path");
        if (!filePath) {
          sendJson(res, 400, { error: "Missing path parameter" });
          return;
        }

        const result = readFileContent(projectRoot, filePath);
        if (!result) {
          sendJson(res, 404, { error: "File not found" });
          return;
        }

        sendJson(res, 200, result);
        return;
      }

      if (req.method === "PUT" && pathname.startsWith("/content")) {
        const filePath = url.searchParams.get("path");
        if (!filePath) {
          sendJson(res, 400, { error: "Missing path parameter" });
          return;
        }

        const body = await readBody(req);
        const parsed = JSON.parse(body) as { content?: string };
        if (typeof parsed.content !== "string") {
          sendJson(res, 400, { error: "Invalid content" });
          return;
        }

        const result = writeFileContent(projectRoot, filePath, parsed.content);
        if (!result) {
          sendJson(res, 403, { error: "Invalid path" });
          return;
        }

        sendJson(res, 200, result);
        return;
      }

      next();
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });
}

export function fileApiPlugin(projectRoot: string): Plugin {
  return {
    name: "aem-file-api",
    configureServer(server) {
      attachFileApi(server, projectRoot);
    },
    configurePreviewServer(server) {
      attachFileApi(server, projectRoot);
    },
  };
}
