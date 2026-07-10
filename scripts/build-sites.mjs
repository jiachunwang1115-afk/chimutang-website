import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const rootFiles = [
  "index.html",
  "style.min.css",
  "app.min.js",
  "products_clean.json",
  "_headers",
];

const assetDirs = [
  "logo",
  "media",
  "partners",
  "product-assets",
  "product-images-thumb",
  "journal",
];

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function shouldCopy(src) {
  const rel = normalize(path.relative(root, src));
  if (!rel) return true;
  if (rel.startsWith(".git/") || rel === ".git") return false;
  if (rel.startsWith(".vercel/") || rel === ".vercel") return false;
  if (rel.startsWith("dist/") || rel === "dist") return false;
  if (rel.startsWith("node_modules/") || rel === "node_modules") return false;
  if (rel.startsWith("media/motion-atelier-") && path.extname(rel).toLowerCase() === ".mp4") return false;
  if (rel.startsWith("journal/") && path.extname(rel).toLowerCase() === ".png") return false;
  if (rel.startsWith("product-assets/swatch-wall/_")) return false;
  if (rel.startsWith("product-assets/swatch-wall/") && path.extname(rel).toLowerCase() === ".png") return false;
  return true;
}

const workerSource = String.raw`
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4"
};

function cleanPath(pathname) {
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (!pathname || pathname === "/") return "/index.html";
  if (pathname.includes("\0") || pathname.split("/").includes("..")) return null;
  return pathname;
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]{2,8}$/i.test(pathname);
}

function toAssetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url, request);
}

function withAssetHeaders(response, pathname, method) {
  const headers = new Headers(response.headers);
  const extension = pathname.match(/\.[^.\/]+$/)?.[0]?.toLowerCase();
  if (extension && MIME_TYPES[extension] && !headers.has("content-type")) {
    headers.set("content-type", MIME_TYPES[extension]);
  }
  if (extension && /\.(css|js|json|webp|jpg|jpeg|png|gif|svg|mp4)$/i.test(extension)) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  } else {
    headers.set("cache-control", "public, max-age=120");
  }
  return new Response(method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function fetchAsset(request, env, pathname) {
  if (!env?.ASSETS?.fetch) return null;
  const response = await env.ASSETS.fetch(toAssetRequest(request, pathname));
  if (response.status === 404) return null;
  return withAssetHeaders(response, pathname, request.method);
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { allow: "GET, HEAD" }
      });
    }

    const url = new URL(request.url);
    const pathname = cleanPath(url.pathname);
    if (!pathname) return new Response("Bad request", { status: 400 });

    const assetPath = hasFileExtension(pathname) ? pathname : "/index.html";
    const asset = await fetchAsset(request, env, assetPath);
    if (asset) return asset;

    if (assetPath !== "/index.html") {
      const fallback = await fetchAsset(request, env, "/index.html");
      if (fallback) return fallback;
    }

    return new Response("Not found", { status: 404 });
  }
};
`;

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, "server"), { recursive: true });

for (const file of rootFiles) {
  await cp(path.join(root, file), path.join(dist, file));
}

for (const dir of assetDirs) {
  await cp(path.join(root, dir), path.join(dist, dir), {
    recursive: true,
    filter: shouldCopy,
  });
}

await writeFile(path.join(dist, "server", "index.js"), `${workerSource.trim()}\n`, "utf8");

console.log("Sites build ready: dist/server/index.js and static assets generated.");
