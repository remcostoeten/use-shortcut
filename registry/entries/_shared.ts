import type {
  PackageConfig,
  RegistryBuildOptions,
  RegistryItem,
} from "../types";

function getRegistryLabel(pkg: PackageConfig) {
  if (pkg.kind === "extension") return "editor-extension";
  if (pkg.kind === "cli") return "command-line-tooling";
  return "react-package";
}

export function createRegistryItems(
  packages: PackageConfig[],
  options: RegistryBuildOptions,
): RegistryItem[] {
  return packages.map((pkg) => {
    const docsUrl = options.getPackageDocsUrl(pkg.slug);

    return {
      id: pkg.slug,
      title: pkg.installName || pkg.packageName,
      description: pkg.description,
      kind: pkg.kind ?? "package",
      status: "live",
      label: getRegistryLabel(pkg),
      href: options.isCurrentSiteUrl(docsUrl)
        ? options.getPackagePath(pkg.slug)
        : docsUrl,
      docsUrl,
      githubUrl: pkg.links.github,
      npmPackageName:
        pkg.kind === "package" || !pkg.kind
          ? pkg.installName || pkg.packageName
          : undefined,
      tagline: pkg.tagline,
    };
  });
}

export const upcomingRegistryItems: RegistryItem[] = [
  {
    id: "tooling-clis",
    title: "tooling-clis",
    description:
      "a bucket for upcoming command-line tools around scaffolding, release flow, and day-to-day project automation.",
    kind: "cli",
    status: "upcoming",
    label: "command-line-tooling",
    githubUrl: "https://github.com/remcostoeten/use-shortcut",
    tagline: "planned",
  },
  {
    id: "general-purpose-vscode-extension",
    title: "general-purpose-vscode-extension",
    description:
      "an upcoming vscode extension for reusable editor commands, workflow helpers, and tighter project ergonomics.",
    kind: "extension",
    status: "upcoming",
    label: "editor-extension",
    githubUrl: "https://github.com/remcostoeten/use-shortcut",
    tagline: "upcoming",
  },
];
