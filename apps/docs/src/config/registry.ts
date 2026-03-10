import type { PackageConfig, RegistryItem } from "./types";
import useShortcutConfig from "./packages/use-shortcut";
import { analyticsConfig } from "./packages/analytics";
import vscodeCodeRefineryConfig from "./packages/vscode-code-refinery";
import { getPackageDocsUrl, getPackagePath, isCurrentSiteUrl } from "./site";

export const packages: PackageConfig[] = [
  useShortcutConfig,
  analyticsConfig,
  vscodeCodeRefineryConfig,
];

export const registryItems: RegistryItem[] = [
  ...packages.map((pkg) => {
    const docsUrl = getPackageDocsUrl(pkg.slug);

    return {
      id: pkg.slug,
      title: pkg.installName || pkg.packageName,
      description: pkg.description,
      kind: pkg.kind ?? "package",
      status: "live" as const,
      label:
        pkg.kind === "extension"
          ? "editor-extension"
          : pkg.kind === "cli"
            ? "command-line-tooling"
            : "react-package",
      href: isCurrentSiteUrl(docsUrl) ? getPackagePath(pkg.slug) : docsUrl,
      docsUrl,
      githubUrl: pkg.links.github,
      npmPackageName: pkg.kind === "package" || !pkg.kind
        ? pkg.installName || pkg.packageName
        : undefined,
      tagline: pkg.tagline,
    };
  }),
  {
    id: "tooling-clis",
    title: "tooling-clis",
    description: "a bucket for upcoming command-line tools around scaffolding, release flow, and day-to-day project automation.",
    kind: "cli",
    status: "upcoming",
    label: "command-line-tooling",
    githubUrl: "https://github.com/remcostoeten/use-shortcut",
    tagline: "planned",
  },
];

export function getPackageBySlug(slug: string): PackageConfig | undefined {
    return packages.find((p) => p.slug === slug);
}
