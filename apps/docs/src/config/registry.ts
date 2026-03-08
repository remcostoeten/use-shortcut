import type { PackageConfig } from "./types";
import useShortcutConfig from "./packages/use-shortcut";
import { analyticsConfig } from "./packages/analytics";

export const packages: PackageConfig[] = [useShortcutConfig, analyticsConfig];

export function getPackageBySlug(slug: string): PackageConfig | undefined {
    return packages.find((p) => p.slug === slug);
}
