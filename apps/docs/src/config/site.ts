export type DocsMode = "registry" | "package";

const DEFAULT_SITE_URL = "https://use-shortcut.vercel.app";
const DEFAULT_PRIMARY_PACKAGE_SLUG = "use-shortcut";

function normalizeUrl(raw?: string) {
  if (!raw) return DEFAULT_SITE_URL;
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `https://${raw}`;

  return withProtocol.replace(/\/+$/, "");
}

function getPackageDocsUrlFromEnv(slug: string) {
  switch (slug) {
    case "analytics":
      return import.meta.env.VITE_ANALYTICS_DOCS_URL as string | undefined;
    case "use-shortcut":
      return import.meta.env.VITE_USE_SHORTCUT_DOCS_URL as string | undefined;
    case "vscode-code-refinery":
      return import.meta.env.VITE_VSCODE_CODE_REFINERY_DOCS_URL as string | undefined;
    default:
      return undefined;
  }
}

export const DOCS_MODE: DocsMode = import.meta.env.VITE_DOCS_MODE === "package"
  ? "package"
  : "registry";

export const PRIMARY_PACKAGE_SLUG =
  (import.meta.env.VITE_PRIMARY_PACKAGE_SLUG as string | undefined)
  || DEFAULT_PRIMARY_PACKAGE_SLUG;

export const SITE_URL = normalizeUrl(import.meta.env.VITE_SITE_URL as string | undefined);
export const REGISTRY_SITE_URL = normalizeUrl(
  (import.meta.env.VITE_REGISTRY_SITE_URL as string | undefined) || SITE_URL,
);

export const PACKAGE_OG_IMAGE_URL = `${SITE_URL}/og-image.svg`;
export const PACKAGE_REPO_URL = "https://github.com/remcostoeten/use-shortcut";
export const PACKAGE_DOCS_URL = getPackageDocsUrl("use-shortcut");

export function getRegistryUrl() {
  return REGISTRY_SITE_URL;
}

export function getPackageDocsUrl(slug: string) {
  const envUrl = getPackageDocsUrlFromEnv(slug);
  if (envUrl) return normalizeUrl(envUrl);

  if (DOCS_MODE === "package" && slug === PRIMARY_PACKAGE_SLUG) {
    return SITE_URL;
  }

  return `${REGISTRY_SITE_URL}/${slug}`;
}

export function getPackagePath(slug: string) {
  if (DOCS_MODE === "package" && slug === PRIMARY_PACKAGE_SLUG) {
    return "/";
  }

  return `/${slug}`;
}

export function isAbsoluteUrl(value: string) {
  return /^https?:\/\//.test(value);
}

export function isCurrentSiteUrl(value: string) {
  if (!isAbsoluteUrl(value)) return false;

  try {
    return new URL(value).origin === new URL(SITE_URL).origin;
  } catch {
    return false;
  }
}

export function toCanonicalUrl(pathOrUrl: string) {
  if (isAbsoluteUrl(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, SITE_URL).toString();
}
