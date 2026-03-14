import type {
  ApiCapability,
  ApiMethod,
  ApiProp,
  ApiPropGuidance,
  CodeExample,
  PackageConfig,
  UiUseCase,
} from "@/config/types";

export type DocsKnowledgeKind =
  | "guide"
  | "prop"
  | "capability"
  | "method"
  | "option"
  | "example"
  | "use-case";

export interface DocsKnowledgeEntry {
  id: string;
  title: string;
  kind: DocsKnowledgeKind;
  sectionId: string;
  sectionLabel: string;
  summary: string;
  description?: string;
  whenToUse?: string;
  defaultValue?: string;
  signature?: string;
  keywords: string[];
  example?: string;
  exampleLanguage?: string;
}

export interface DocsSearchResult {
  entry: DocsKnowledgeEntry;
  score: number;
}

export interface DocsAnswer {
  headline: string;
  summary: string;
  bullets: string[];
  example?: string;
  exampleLanguage?: string;
  citations: DocsSearchResult[];
  confidence: "high" | "medium" | "low";
}

const TOKEN_SPLIT = /[^a-z0-9]+/g;

const SYNONYMS: Record<string, string[]> = {
  ai: ["assistant", "ask", "search", "help"],
  ask: ["question", "help", "assistant"],
  binding: ["shortcut", "hotkey", "keybind", "combo"],
  combo: ["shortcut", "hotkey", "binding", "keybind"],
  conflict: ["collision", "overlap", "warning"],
  docs: ["documentation", "guide", "reference"],
  hotkey: ["shortcut", "binding", "keybind", "combo"],
  install: ["setup", "getting-started", "npm", "pnpm", "bun", "yarn", "marketplace", "extension", "code"],
  keybind: ["shortcut", "hotkey", "binding", "combo"],
  parse: ["parser", "normalize"],
  prop: ["option", "config", "parameter"],
  scope: ["context", "section", "mode"],
  sequence: ["chain", "step", "combo"],
  setup: ["install", "quickstart", "start", "marketplace", "extension"],
  shortcut: ["hotkey", "binding", "keybind", "combo"],
  use: ["when", "why", "should"],
};

const KIND_PRIORITY: Record<DocsKnowledgeKind, number> = {
  guide: 70,
  prop: 64,
  capability: 60,
  example: 56,
  "use-case": 52,
  method: 48,
  option: 46,
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function compact(value: string) {
  return normalize(value).replace(TOKEN_SPLIT, "");
}

function tokenize(value: string) {
  return normalize(value)
    .split(TOKEN_SPLIT)
    .map((token) => token.trim())
    .filter(Boolean);
}

function withKeywords(...values: Array<string | undefined>) {
  return values
    .flatMap((value) => tokenize(value ?? ""))
    .filter(Boolean);
}

function buildPropEntry(prop: ApiProp, guidance?: ApiPropGuidance): DocsKnowledgeEntry {
  return {
    id: `prop:${prop.name}`,
    title: prop.name,
    kind: "prop",
    sectionId: "api",
    sectionLabel: "api options",
    summary: prop.description,
    description: guidance?.guidance,
    whenToUse: guidance?.whenToUse,
    defaultValue: prop.default,
    example: guidance?.example,
    exampleLanguage: guidance?.exampleLanguage,
    keywords: withKeywords(
      prop.name,
      prop.type,
      prop.description,
      guidance?.guidance,
      guidance?.whenToUse,
      "prop option config parameter api",
    ),
  };
}

function buildCapabilityEntry(item: ApiCapability): DocsKnowledgeEntry {
  return {
    id: `capability:${item.name}`,
    title: item.name,
    kind: "capability",
    sectionId: "api-reference",
    sectionLabel: "api reference",
    summary: item.summary,
    description: item.possible,
    example: item.example,
    exampleLanguage: item.exampleLanguage,
    keywords: withKeywords(
      item.name,
      item.kind,
      item.summary,
      item.possible,
      "api export utility helper reference",
    ),
  };
}

function buildMethodEntry(groupTitle: string, item: ApiMethod): DocsKnowledgeEntry {
  return {
    id: `method:${item.name}`,
    title: item.name,
    kind: "method",
    sectionId: "api-matrix",
    sectionLabel: "api matrix",
    summary: item.description,
    signature: item.signature,
    keywords: withKeywords(
      groupTitle,
      item.name,
      item.signature,
      item.description,
      "method chain builder signature",
    ),
  };
}

function buildOptionEntry(groupTitle: string, item: ApiProp): DocsKnowledgeEntry {
  return {
    id: `option:${groupTitle}:${item.name}`,
    title: item.name,
    kind: "option",
    sectionId: "api-matrix",
    sectionLabel: "api matrix",
    summary: item.description,
    defaultValue: item.default,
    keywords: withKeywords(
      groupTitle,
      item.name,
      item.type,
      item.description,
      "option config matrix",
    ),
  };
}

function buildExampleEntry(item: CodeExample): DocsKnowledgeEntry {
  return {
    id: `example:${item.title}`,
    title: item.title,
    kind: "example",
    sectionId: "syntax",
    sectionLabel: "recipes",
    summary: item.description ?? "Copy-ready implementation example.",
    example: item.code,
    exampleLanguage: item.language,
    keywords: withKeywords(
      item.title,
      item.description,
      item.code,
      "recipe example snippet implementation",
    ),
  };
}

function buildUseCaseEntry(item: UiUseCase): DocsKnowledgeEntry {
  return {
    id: `use-case:${item.id}`,
    title: item.title,
    kind: "use-case",
    sectionId: "syntax",
    sectionLabel: "recipes",
    summary: item.summary,
    description: item.notes?.join(" "),
    whenToUse: item.whenToUse,
    keywords: withKeywords(
      item.title,
      item.summary,
      item.whenToUse,
      item.actions.map((action) => `${action.label} ${action.shortcut}`).join(" "),
      item.notes?.join(" "),
      "workflow use case ui actions",
    ),
  };
}

export function buildDocsKnowledge(config: PackageConfig): DocsKnowledgeEntry[] {
  const entries: DocsKnowledgeEntry[] = [];
  const packageKind = config.kind ?? "package";
  const installMethods = config.install?.methods ?? [
    { command: `npm i ${config.installName}`, label: "npm" },
    { command: `pnpm add ${config.installName}`, label: "pnpm" },
    { command: `bun add ${config.installName}`, label: "bun" },
    { command: `yarn add ${config.installName}`, label: "yarn" },
  ];
  const installCommands = installMethods.map((method) => method.command).join("\n");
  const installKeywords = installMethods
    .map((method) => `${method.label} ${method.command}`)
    .join(" ");
  const installSummary = packageKind === "extension"
    ? `Install ${config.installName} from the VS Code marketplace or run it locally in the extension host.`
    : `Install ${config.installName} with npm, bun, pnpm, or yarn.`;
  const installDescription = config.install?.description
    ?? (packageKind === "extension"
      ? "Start with the install command, then trigger commands from the explorer context menu or the command palette."
      : "Start with the install command, then create a useShortcut instance and register bindings from your component.");
  const guidanceByProp = new Map(
    (config.apiPropGuidance ?? []).map((item) => [item.prop, item]),
  );

  entries.push({
    id: "guide:overview",
    title: `${config.packageName} overview`,
    kind: "guide",
    sectionId: "overview",
    sectionLabel: "overview",
    summary: config.description,
    description: config.why?.paragraphs.join(" "),
    keywords: withKeywords(
      config.packageName,
      config.description,
      config.heroTitle,
      config.features?.map((feature) => `${feature.label} ${feature.description}`).join(" "),
      "overview intro package",
    ),
  });

  entries.push({
    id: "guide:install",
    title: "install and setup",
    kind: "guide",
    sectionId: "install",
    sectionLabel: "install",
    summary: installSummary,
    description: installDescription,
    example: installCommands,
    exampleLanguage: "bash",
    keywords: withKeywords(
      config.installName,
      config.packageName,
      installKeywords,
      packageKind === "extension"
        ? "install setup getting started marketplace vscode extension code command palette"
        : "install setup getting started npm pnpm bun yarn quickstart",
    ),
  });

  for (const prop of config.apiProps ?? []) {
    entries.push(buildPropEntry(prop, guidanceByProp.get(prop.name)));
  }

  for (const capability of config.apiCapabilities ?? []) {
    entries.push(buildCapabilityEntry(capability));
  }

  for (const group of config.apiMethodGroups ?? []) {
    for (const method of group.methods) {
      entries.push(buildMethodEntry(group.title, method));
    }
  }

  for (const group of config.apiOptionGroups ?? []) {
    for (const option of group.options) {
      entries.push(buildOptionEntry(group.title, option));
    }
  }

  for (const example of config.codeExamples ?? []) {
    entries.push(buildExampleEntry(example));
  }

  for (const item of config.uiUseCases ?? []) {
    entries.push(buildUseCaseEntry(item));
  }

  return entries;
}

function scoreEntry(entry: DocsKnowledgeEntry, query: string) {
  if (!query) {
    return KIND_PRIORITY[entry.kind];
  }

  const tokens = tokenize(query);
  const phrase = normalize(query);
  const title = normalize(entry.title);
  const summary = normalize(entry.summary);
  const description = normalize(entry.description ?? "");
  const whenToUse = normalize(entry.whenToUse ?? "");
  const section = normalize(entry.sectionLabel);
  const signature = normalize(entry.signature ?? "");
  const defaultValue = normalize(entry.defaultValue ?? "");
  const example = normalize(entry.example ?? "");
  const keywords = entry.keywords.join(" ");
  const corpus = `${title} ${summary} ${description} ${whenToUse} ${section} ${signature} ${defaultValue} ${example} ${keywords}`;

  let score = 0;

  if (title === phrase) score += 120;
  if (compact(title) === compact(phrase)) score += 110;
  if (title.startsWith(phrase)) score += 70;
  if (title.includes(phrase)) score += 54;
  if (section.includes(phrase)) score += 32;
  if (summary.includes(phrase)) score += 26;
  if (description.includes(phrase)) score += 20;
  if (whenToUse.includes(phrase)) score += 18;
  if (signature.includes(phrase)) score += 22;
  if (example.includes(phrase)) score += 14;

  for (const token of tokens) {
    if (title === token) score += 48;
    if (compact(title) === compact(token)) score += 46;
    if (title.startsWith(token)) score += 24;
    if (title.includes(token)) score += 16;
    if (section.includes(token)) score += 12;
    if (summary.includes(token)) score += 10;
    if (description.includes(token)) score += 9;
    if (whenToUse.includes(token)) score += 10;
    if (signature.includes(token)) score += 10;
    if (defaultValue.includes(token)) score += 5;
    if (example.includes(token)) score += 4;
    if (keywords.includes(token)) score += 8;

    for (const alias of SYNONYMS[token] ?? []) {
      if (corpus.includes(alias)) score += 6;
    }
  }

  const matchedTokenCount = tokens.filter((token) => corpus.includes(token)).length;
  score += matchedTokenCount * 10;

  if (tokens.length > 1 && matchedTokenCount === tokens.length) {
    score += 36;
  } else if (tokens.length > 2 && matchedTokenCount >= Math.ceil(tokens.length / 2)) {
    score += 18;
  } else if (tokens.length > 1 && matchedTokenCount <= 1) {
    score -= 24;
  }

  if (entry.kind === "guide" && tokens.some((token) => token === "install" || token === "setup")) {
    score += 18;
  }

  if (
    entry.id === "guide:install"
    && tokens.some((token) => token === "install" || token === "setup" || token === "start")
  ) {
    score += 40;
  }

  if (entry.kind === "prop" && tokens.some((token) => token === "prop" || token === "option")) {
    score += 12;
  }

  return score;
}

export function searchDocsKnowledge(
  entries: DocsKnowledgeEntry[],
  query: string,
  limit = 12,
) {
  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
    .filter(({ score }) => (query.trim() ? score > 0 : true))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.entry.title.localeCompare(right.entry.title);
    })
    .slice(0, limit);
}

export function buildDocsAnswer(
  entries: DocsKnowledgeEntry[],
  query: string,
  limit = 3,
): DocsAnswer {
  const citations = searchDocsKnowledge(entries, query, limit);
  const primary = citations[0]?.entry;

  if (!primary) {
    return {
      headline: "No grounded answer found",
      summary: "Try a prop name, export, setup question, or a concrete behavior like sequences or scopes.",
      bullets: [
        "Search works best with exact prop and export names.",
        "The assistant only answers from this docs dataset.",
      ],
      citations: [],
      confidence: "low",
    };
  }

  const bullets = [
    primary.description,
    primary.whenToUse ? `When to use: ${primary.whenToUse}` : undefined,
    primary.defaultValue ? `Default: ${primary.defaultValue}` : undefined,
    primary.signature ? `Signature: ${primary.signature}` : undefined,
  ].filter((value): value is string => Boolean(value));

  if (bullets.length === 0) {
    bullets.push(primary.summary);
  }

  const confidence =
    citations[0].score >= 90
      ? "high"
      : citations[0].score >= 40
        ? "medium"
        : "low";

  return {
    headline: primary.title,
    summary: primary.summary,
    bullets,
    example: primary.example,
    exampleLanguage: primary.exampleLanguage,
    citations,
    confidence,
  };
}

export function buildSuggestedQuestions(entries: DocsKnowledgeEntry[]) {
  const install = entries.find((entry) => entry.id === "guide:install");
  const usefulProps = entries.filter((entry) => entry.kind === "prop").slice(0, 3);
  const usefulCapabilities = entries.filter((entry) => entry.kind === "capability").slice(0, 3);
  const usefulRecipes = entries.filter((entry) => entry.kind === "component").slice(0, 2);

  return [
    install ? "How do I install and set this up?" : undefined,
    usefulProps[0] ? `When should I use ${usefulProps[0].title}?` : undefined,
    usefulProps[1] ? `What does ${usefulProps[1].title} do?` : undefined,
    usefulRecipes[0] ? `Show me the ${usefulRecipes[0].title} recipe.` : undefined,
    usefulCapabilities[0] ? `How do I use ${usefulCapabilities[0].title}?` : undefined,
    usefulCapabilities[1] ? `Show me an example for ${usefulCapabilities[1].title}.` : undefined,
  ].filter((value): value is string => Boolean(value));
}
