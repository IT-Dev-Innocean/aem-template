import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const ALLOWED_ROOTS = ["hmid", "kia"] as const;

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
};

function resolveSafePath(projectRoot: string, relativePath: string): string | null {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.resolve(projectRoot, normalized);
  const relative = path.relative(projectRoot, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  const rootFolder = relative.split(path.sep)[0];
  if (!ALLOWED_ROOTS.includes(rootFolder as (typeof ALLOWED_ROOTS)[number])) {
    return null;
  }

  return fullPath;
}

function buildTree(dirPath: string, relativePath: string): FileNode[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    })
    .map((entry) => {
      const entryRelative = path.join(relativePath, entry.name);
      const entryAbsolute = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: entryRelative.replace(/\\/g, "/"),
          type: "folder" as const,
          children: buildTree(entryAbsolute, entryRelative),
        };
      }

      return {
        name: entry.name,
        path: entryRelative.replace(/\\/g, "/"),
        type: "file" as const,
      };
    });
}

function sendJson(res: import("node:http").ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
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
          req: import("node:http").IncomingMessage,
          res: import("node:http").ServerResponse,
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
        const tree: FileNode[] = ALLOWED_ROOTS.map((folder) => ({
          name: folder,
          path: folder,
          type: "folder" as const,
          children: buildTree(path.join(projectRoot, folder), folder),
        }));
        sendJson(res, 200, tree);
        return;
      }

      if (req.method === "GET" && pathname.startsWith("/content")) {
        const filePath = url.searchParams.get("path");
        if (!filePath) {
          sendJson(res, 400, { error: "Missing path parameter" });
          return;
        }

        const safePath = resolveSafePath(projectRoot, filePath);
        if (!safePath || !fs.existsSync(safePath) || !fs.statSync(safePath).isFile()) {
          sendJson(res, 404, { error: "File not found" });
          return;
        }

        const content = fs.readFileSync(safePath, "utf-8");
        sendJson(res, 200, { path: filePath, content });
        return;
      }

      if (req.method === "PUT" && pathname.startsWith("/content")) {
        const filePath = url.searchParams.get("path");
        if (!filePath) {
          sendJson(res, 400, { error: "Missing path parameter" });
          return;
        }

        const safePath = resolveSafePath(projectRoot, filePath);
        if (!safePath) {
          sendJson(res, 403, { error: "Invalid path" });
          return;
        }

        const body = await readBody(req);
        const parsed = JSON.parse(body) as { content?: string };
        if (typeof parsed.content !== "string") {
          sendJson(res, 400, { error: "Invalid content" });
          return;
        }

        fs.mkdirSync(path.dirname(safePath), { recursive: true });
        fs.writeFileSync(safePath, parsed.content, "utf-8");
        sendJson(res, 200, { path: filePath, saved: true });
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
