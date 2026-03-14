import { createRegistryItems, upcomingRegistryItems } from "./_shared";
import {
  analyticsEntry,
  packageEntries,
  useShortcutEntry,
  vscodeCodeRefineryEntry,
} from "./packages";
import type {
  PackageConfig,
  RegistryBuildOptions,
  RegistryItem,
} from "../types";

export {
  analyticsEntry,
  createRegistryItems,
  packageEntries,
  upcomingRegistryItems,
  useShortcutEntry,
  vscodeCodeRefineryEntry,
};

export const entries: PackageConfig[] = packageEntries;

export function buildRegistryItems(options: RegistryBuildOptions): RegistryItem[] {
  return [...createRegistryItems(entries, options), ...upcomingRegistryItems];
}

export function getEntryBySlug(slug: string): PackageConfig | undefined {
  return entries.find((entry) => entry.slug === slug);
}
