import type { PackageConfig, RegistryItem } from "./types";
import useShortcutConfig from "./packages/use-shortcut";
import { analyticsConfig } from "./packages/analytics";

export const packages: PackageConfig[] = [useShortcutConfig, analyticsConfig];

export const registryItems: RegistryItem[] = [
  ...packages.map((pkg) => ({
    id: pkg.slug,
    title: pkg.installName || pkg.packageName,
    description: pkg.description,
    kind: "package" as const,
    status: "live" as const,
    label: "react-package",
    href: `/${pkg.slug}`,
    githubUrl: pkg.links.github,
    npmPackageName: pkg.installName || pkg.packageName,
    tagline: pkg.tagline,
  })),
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
  {
    id: "general-purpose-vscode-extension",
    title: "general-purpose-vscode-extension",
    description: "an upcoming vscode extension for reusable editor commands, workflow helpers, and tighter project ergonomics.",
    kind: "extension",
    status: "upcoming",
    label: "editor-extension",
    githubUrl: "https://github.com/remcostoeten/use-shortcut",
    tagline: "upcoming",
  },
];

export const registryItems: RegistryItem[] = [
  ...packages.map((pkg) => ({
    id: pkg.slug,
    title: pkg.installName || pkg.packageName,
    description: pkg.description,
    kind: "package" as const,
    status: "live" as const,
    label: "react-package",
    href: `/${pkg.slug}`,
    githubUrl: pkg.links.github,
    npmPackageName: pkg.installName || pkg.packageName,
    tagline: pkg.tagline,
  })),
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
  {
    id: "general-purpose-vscode-extension",
    title: "general-purpose-vscode-extension",
    description: "an upcoming vscode extension for reusable editor commands, workflow helpers, and tighter project ergonomics.",
    kind: "extension",
    status: "upcoming",
    label: "editor-extension",
    githubUrl: "https://github.com/remcostoeten/use-shortcut",
    tagline: "upcoming",
  },
];

export function getPackageBySlug(slug: string): PackageConfig | undefined {
    return packages.find((p) => p.slug === slug);
}
