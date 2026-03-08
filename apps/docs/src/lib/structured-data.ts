import { PACKAGE_DOCS_URL, PACKAGE_REPO_URL } from "@/config/site";

type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

function upsertJsonLd(id: string, payload: JsonLdValue) {
  let element = document.getElementById(id) as HTMLScriptElement | null;
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.id = id;
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(payload);
}

export function applyWebsiteStructuredData() {
  upsertJsonLd("structured-data-website", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "use-shortcut docs",
    url: PACKAGE_DOCS_URL,
    description: "Typed React keyboard shortcuts with combos, sequences, scopes, parser utilities, and shortcut recording.",
    publisher: {
      "@type": "Person",
      name: "Remco Stoeten",
      url: "https://github.com/remcostoeten",
    },
  });
}

export function applySoftwareStructuredData() {
  upsertJsonLd("structured-data-software", {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: "@remcostoeten/use-shortcut",
    codeRepository: PACKAGE_REPO_URL,
    url: PACKAGE_DOCS_URL,
    description: "Typed React keyboard shortcuts with combos, sequences, scopes, parser utilities, and shortcut recording.",
    programmingLanguage: "TypeScript",
    runtimePlatform: "React",
    author: {
      "@type": "Person",
      name: "Remco Stoeten",
      url: "https://github.com/remcostoeten",
    },
  });
}
