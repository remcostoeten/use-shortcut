import analyticsEntry from "./analytics";
import useShortcutEntry from "./use-shortcut";
import vscodeCodeRefineryEntry from "./vscode-code-refinery";
import type { PackageConfig } from "../../types";

export { analyticsEntry, useShortcutEntry, vscodeCodeRefineryEntry };

export const packageEntries: PackageConfig[] = [
  useShortcutEntry,
  analyticsEntry,
  vscodeCodeRefineryEntry,
];
