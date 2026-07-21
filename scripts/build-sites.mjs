import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");

const rootFiles = [
  "index.html",
  "dealer-quote.html",
  "style.min.css",
  "dealer-quote.css",
  "app.min.js",
  "dealer-quote.js",
  "quote-core.mjs",
  "quote-drafts.mjs",
  "quote-ppt.mjs",
  "quote-content.json",
  "mini-mode.css",
  "mini-mode.js",
  "products_clean.json",
  "_headers",
];

const explicitAssets = [
  "media/mini-nav/home-default.png",
  "media/mini-nav/home-active.png",
  "media/mini-nav/products-default.png",
  "media/mini-nav/products-active.png",
  "media/mini-nav/journal-default.png",
  "media/mini-nav/journal-active.png",
  "media/mini-nav/service-default.png",
  "media/mini-nav/service-active.png",
  "media/mini-nav/profile-default.png",
  "media/mini-nav/profile-active.png",
];

const vendorFiles = [
  ["vendor/pptxgen.bundle.js", "vendor/pptxgen.bundle.js"],
  ["vendor/pdf-lib.min.js", "vendor/pdf-lib.min.js"],
];

const runtimeFiles = [
  ...rootFiles,
  "journal/muchi_articles_data.min.js",
];

const assetPattern = /(?:logo|media|partners|product-assets|product-images-thumb|journal)\/[^"'()\s<>?]+?\.(?:webp|jpg|jpeg|png|gif|svg|mp4)/gi;
const optionalAssets = /^media\/motion-atelier-\d{2}\.mp4$/i;

const workerSource = String.raw`
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
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
  if (extension && /\.(css|js|mjs|json|webp|jpg|jpeg|png|gif|svg|mp4)$/i.test(extension)) {
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
await mkdir(client, { recursive: true });

for (const file of [...runtimeFiles, ...explicitAssets]) {
  const destination = path.join(client, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(root, file), destination);
}

for (const [sourceFile, destinationFile] of vendorFiles) {
  const destination = path.join(client, destinationFile);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(root, sourceFile), destination);
}

const runtimeText = (
  await Promise.all(runtimeFiles.map((file) => readFile(path.join(root, file), "utf8")))
).join("\n");
const assetPaths = [...new Set(runtimeText.match(assetPattern) || [])].sort();

let copiedAssets = explicitAssets.length;
for (const asset of assetPaths) {
  if (optionalAssets.test(asset)) continue;
  const source = path.join(root, asset);
  const destination = path.join(client, asset);
  try {
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination);
    copiedAssets += 1;
  } catch (error) {
    throw error;
  }
}

await writeFile(path.join(dist, "server", "index.js"), `${workerSource.trim()}\n`, "utf8");

console.log(`Sites build ready with ${copiedAssets} referenced assets.`);
