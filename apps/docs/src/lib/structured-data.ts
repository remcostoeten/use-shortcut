type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

const SITE_URL = "https://use-shortcut.vercel.app/";
const DESCRIPTION =
  "Typed React keyboard shortcuts with combos, sequences, scopes, parser utilities, and shortcut recording.";
const AUTHOR = {
  "@type": "Person",
  name: "Remco Stoeten",
  url: "https://github.com/remcostoeten",
};

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
    url: SITE_URL,
    description: DESCRIPTION,
    publisher: AUTHOR,
  });
}

export function applySoftwareStructuredData() {
  upsertJsonLd("structured-data-software", {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: "@remcostoeten/use-shortcut",
    codeRepository: "https://github.com/remcostoeten/use-shortcut",
    url: SITE_URL,
    description: DESCRIPTION,
    programmingLanguage: "TypeScript",
    runtimePlatform: "React",
    license: "https://github.com/remcostoeten/use-shortcut/blob/master/packages/use-shortcut/LICENSE",
    keywords: ["react", "keyboard shortcuts", "hotkeys", "typescript", "hooks"],
    author: AUTHOR,
  });
}
