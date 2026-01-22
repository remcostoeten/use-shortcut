#!/usr/bin/env node
#!/usr/bin/env node

// cli/index.ts
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var COLORS = {
  reset: "\x1B[0m",
  green: "\x1B[32m",
  cyan: "\x1B[36m",
  yellow: "\x1B[33m",
  dim: "\x1B[2m"
};
function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}
function getSrcPath() {
  return join(__dirname, "..", "src");
}
function getDestPath(targetDir) {
  return join(process.cwd(), targetDir, "use-shortcut");
}
var FILES = [
  "index.ts",
  "hook.ts",
  "builder.ts",
  "types.ts",
  "parser.ts",
  "constants.ts",
  "formatter.ts"
];
function init(targetDir = "hooks") {
  const srcPath = getSrcPath();
  const destPath = getDestPath(targetDir);
  log("\n\u{1F3B9} use-shortcut CLI\n", COLORS.cyan);
  if (existsSync(destPath)) {
    log(`\u26A0\uFE0F  Directory already exists: ${destPath}`, COLORS.yellow);
    log("   Use --force to overwrite\n");
    return;
  }
  mkdirSync(destPath, { recursive: true });
  for (const file of FILES) {
    const srcFile = join(srcPath, file);
    const destFile = join(destPath, file);
    if (!existsSync(srcFile)) {
      log(`\u26A0\uFE0F  Source file not found: ${file}`, COLORS.yellow);
      continue;
    }
    let content = readFileSync(srcFile, "utf-8");
    content = content.replace(/"use client"\n\n/, '"use client"\n\n');
    writeFileSync(destFile, content);
    log(`  \u2713 ${file}`, COLORS.green);
  }
  log("\n\u2728 Done! Files copied to:", COLORS.green);
  log(`   ${destPath}
`, COLORS.dim);
  log("Usage:", COLORS.cyan);
  log(`  import { useShortcut } from "@/${targetDir}/use-shortcut"
`, COLORS.dim);
  log("  const $ = useShortcut()", COLORS.dim);
  log('  $.mod.key("k").on(() => console.log("Search!"))\n', COLORS.dim);
}
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (command === "init") {
    const targetIndex = args.indexOf("--target");
    const targetDir = targetIndex !== -1 ? args[targetIndex + 1] : "hooks";
    init(targetDir);
  } else {
    log("\n\u{1F3B9} use-shortcut CLI\n", COLORS.cyan);
    log("Commands:", COLORS.yellow);
    log("  init              Copy files to your project");
    log("  init --target lib Copy to custom directory\n");
  }
}
main();
