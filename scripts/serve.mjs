import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const siteRoot = resolve(projectRoot, process.argv.includes("--dist") ? "dist" : ".");
const publicRoot = resolve(siteRoot, process.argv.includes("--dist") ? "." : "public");
const port = Number(process.env.PORT ?? 4173);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
]);

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Invalid request path");
    return;
  }

  const filePath = pathname === "/"
    ? join(siteRoot, "index.html")
    : resolve(publicRoot, `.${pathname}`);
  const insidePublicRoot =
    filePath.startsWith(`${publicRoot}${sep}`) || filePath === publicRoot;

  if (pathname !== "/" && !insidePublicRoot) {
    response.writeHead(404).end("Not found");
    return;
  }

  try {
    await access(filePath);
    if (!(await stat(filePath)).isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
  } catch {
    response.writeHead(404).end("Not found");
    return;
  }

  const headers = {
    "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream",
    "Cache-Control": pathname === "/" ? "no-cache" : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
  response.writeHead(200, headers);
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Website available at http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("Could not start the website:", error.message);
  process.exitCode = 1;
});
