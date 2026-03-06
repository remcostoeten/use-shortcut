import type { PackageConfig } from "./types";
import useShortcutConfig from "./packages/use-shortcut";

export const packages: PackageConfig[] = [useShortcutConfig];

export function getPackageBySlug(slug: string): PackageConfig | undefined {
    return packages.find((p) => p.slug === slug);
}
