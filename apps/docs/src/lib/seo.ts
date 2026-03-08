import { PACKAGE_OG_IMAGE_URL, SITE_URL } from "@/config/site";

type SeoMeta = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

const DEFAULT_TITLE = "use-shortcut docs";
const DEFAULT_IMAGE = PACKAGE_OG_IMAGE_URL;

function sanitizeTitle(rawTitle: string) {
  const withoutChangelog = rawTitle.replace(/\bchangelog\b/gi, "");
  const compacted = withoutChangelog
    .replace(/\s{2,}/g, " ")
    .replace(/\s*([|:-])\s*([|:-]\s*)+/g, " $1 ")
    .replace(/^[\s|:-]+|[\s|:-]+$/g, "")
    .trim();

  return compacted || DEFAULT_TITLE;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertRobots(content: string) {
  upsertMeta("name", "robots", content);
}

function upsertCanonical(href: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export function applySeoMeta({
  title,
  description,
  path = window.location.pathname,
  image = DEFAULT_IMAGE,
  type = "website",
  noIndex = false,
}: SeoMeta) {
  const canonicalUrl = new URL(path, SITE_URL).toString();
  const safeTitle = sanitizeTitle(title);

  document.title = safeTitle;

  upsertMeta("name", "description", description);

  upsertMeta("property", "og:title", safeTitle);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:type", type);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:url", canonicalUrl);

  upsertMeta("name", "twitter:title", safeTitle);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", image);
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertRobots(noIndex ? "noindex, nofollow" : "index, follow");

  upsertCanonical(canonicalUrl);
}
