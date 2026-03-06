import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function resolveSiteUrl() {
  const raw =
    process.env.SITE_URL
    || process.env.VITE_SITE_URL
    || process.env.VERCEL_PROJECT_PRODUCTION_URL
    || process.env.VERCEL_URL
    || "use-shortcut.vercel.app";

  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `https://${raw}`;

  return withProtocol.replace(/\/+$/, "");
}

async function readPackageSlugs(packagesDir) {
  const entries = await fs.readdir(packagesDir, { withFileTypes: true });
  const slugs = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    const filePath = path.join(packagesDir, entry.name);
    const content = await fs.readFile(filePath, "utf8");
    const match = content.match(/slug:\s*["'`]([^"'`]+)["'`]/);
    if (match) slugs.push(match[1]);
  }

  return slugs;
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDir, "..");
  const publicDir = path.join(projectRoot, "public");
  const packagesDir = path.join(projectRoot, "src", "config", "packages");

  const siteUrl = resolveSiteUrl();
  await readPackageSlugs(packagesDir);
  const routes = ["/"];

  const urlNodes = routes
    .map((route) => {
      const priority = route === "/" ? "1.0" : "0.8";
      const changefreq = route === "/" ? "weekly" : "monthly";
      return `  <url>
    <loc>${siteUrl}${route}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>
`;

  const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, "sitemap.xml"), sitemap, "utf8");
  await fs.writeFile(path.join(publicDir, "robots.txt"), robots, "utf8");

  console.log(`Generated sitemap for ${routes.length} route at ${siteUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
