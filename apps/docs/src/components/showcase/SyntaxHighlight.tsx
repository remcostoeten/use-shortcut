import { Fragment } from "react";

type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "type"
  | "function"
  | "number"
  | "punctuation"
  | "jsx-tag"
  | "property"
  | "command"
  | "boolean"
  | "plain";

interface Token {
  type: TokenType;
  value: string;
}

const JS_KEYWORDS = new Set([
  "import", "export", "from", "const", "let", "var", "function", "return",
  "if", "else", "for", "while", "new", "typeof", "instanceof", "default",
  "async", "await", "class", "extends", "type", "interface", "as", "in",
  "switch", "case", "break", "continue", "try", "catch", "finally",
]);

const JS_LITERALS = new Set(["true", "false", "null", "undefined"]);
const TYPE_KEYWORDS = new Set([
  "string", "number", "boolean", "void", "any", "never", "unknown", "readonly",
]);

const BASH_KEYWORDS = new Set([
  "if", "then", "fi", "for", "do", "done", "in", "while", "until", "case",
  "esac", "elif", "else", "function",
]);

type SupportedLanguage = "tsx" | "json" | "bash";

function normalizeLanguage(language?: string): SupportedLanguage {
  const lower = language?.toLowerCase() ?? "tsx";
  if (lower === "json") return "json";
  if (lower === "bash" || lower === "sh" || lower === "shell" || lower === "zsh") return "bash";
  return "tsx";
}

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_$]/.test(char);
}

function isIdentifier(char: string): boolean {
  return /[A-Za-z0-9_$]/.test(char);
}

function readString(code: string, start: number): number {
  const quote = code[start];
  let i = start + 1;
  while (i < code.length) {
    if (code[i] === "\\") {
      i += 2;
      continue;
    }
    if (code[i] === quote) return i + 1;
    i++;
  }
  return code.length;
}

function tokenizeTsLike(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    if (code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ type: "comment", value: slice });
      i += slice.length;
      continue;
    }

    if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      tokens.push({ type: "comment", value: slice });
      i += slice.length;
      continue;
    }

    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const end = readString(code, i);
      tokens.push({ type: "string", value: code.slice(i, end) });
      i = end;
      continue;
    }

    if (/\d/.test(code[i]) && (i === 0 || code[i - 1] === "[" || /[\s=:(,{]/.test(code[i - 1]))) {
      let j = i;
      while (j < code.length && /[\d._]/.test(code[j])) j++;
      tokens.push({ type: "number", value: code.slice(i, j) });
      i = j;
      continue;
    }

    if (code[i] === "<" && /[A-Za-z/]/.test(code[i + 1] || "")) {
      let j = i + 1;
      if (code[j] === "/") j++;
      while (j < code.length && /[A-Za-z0-9._-]/.test(code[j])) j++;
      tokens.push({ type: "jsx-tag", value: code.slice(i, j) });
      i = j;
      continue;
    }

    if (isIdentifierStart(code[i])) {
      let j = i + 1;
      while (j < code.length && isIdentifier(code[j])) j++;
      const word = code.slice(i, j);

      let k = j;
      while (k < code.length && /\s/.test(code[k])) k++;

      if (JS_KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (JS_LITERALS.has(word)) {
        tokens.push({ type: "boolean", value: word });
      } else if (TYPE_KEYWORDS.has(word) || (word[0] === word[0].toUpperCase() && /[a-z]/.test(word.slice(1)))) {
        tokens.push({ type: "type", value: word });
      } else if (code[k] === "(") {
        tokens.push({ type: "function", value: word });
      } else {
        tokens.push({ type: "plain", value: word });
      }
      i = j;
      continue;
    }

    if (/[{}()[\];,.<>:=?!&|/+*\-@%#~^]/.test(code[i])) {
      tokens.push({ type: "punctuation", value: code[i] });
      i++;
      continue;
    }

    let j = i;
    while (j < code.length && !/["'`/*A-Za-z0-9_$<>{}()[\];,.:=?!&|/+*\-@%#~^\n]/.test(code[j])) j++;
    if (j === i) j++;
    tokens.push({ type: "plain", value: code.slice(i, j) });
    i = j;
  }

  return tokens;
}

function tokenizeJson(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    if (/\s/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /\s/.test(code[j])) j++;
      tokens.push({ type: "plain", value: code.slice(i, j) });
      i = j;
      continue;
    }

    if (code[i] === '"') {
      const end = readString(code, i);
      let next = end;
      while (next < code.length && /\s/.test(code[next])) next++;
      tokens.push({
        type: code[next] === ":" ? "property" : "string",
        value: code.slice(i, end),
      });
      i = end;
      continue;
    }

    const literal = code.slice(i);
    if (literal.startsWith("true") || literal.startsWith("false") || literal.startsWith("null")) {
      const value = literal.startsWith("true") ? "true" : literal.startsWith("false") ? "false" : "null";
      tokens.push({ type: "boolean", value });
      i += value.length;
      continue;
    }

    if (/[-\d]/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /[\d.eE+-]/.test(code[j])) j++;
      tokens.push({ type: "number", value: code.slice(i, j) });
      i = j;
      continue;
    }

    if (/[{}[\],:]/.test(code[i])) {
      tokens.push({ type: "punctuation", value: code[i] });
      i++;
      continue;
    }

    tokens.push({ type: "plain", value: code[i] });
    i++;
  }

  return tokens;
}

function tokenizeBash(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let commandPosition = true;

  while (i < code.length) {
    const char = code[i];

    if (char === "\n") {
      tokens.push({ type: "plain", value: "\n" });
      commandPosition = true;
      i++;
      continue;
    }

    if (/\s/.test(char)) {
      let j = i + 1;
      while (j < code.length && /\s/.test(code[j]) && code[j] !== "\n") j++;
      tokens.push({ type: "plain", value: code.slice(i, j) });
      i = j;
      continue;
    }

    if (char === "#" && (i === 0 || /\s/.test(code[i - 1]))) {
      const end = code.indexOf("\n", i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ type: "comment", value: slice });
      i += slice.length;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      const end = readString(code, i);
      tokens.push({ type: "string", value: code.slice(i, end) });
      commandPosition = false;
      i = end;
      continue;
    }

    if (char === "$") {
      let j = i + 1;
      if (code[j] === "{") {
        j++;
        while (j < code.length && code[j] !== "}") j++;
        if (code[j] === "}") j++;
      } else {
        while (j < code.length && /[A-Za-z0-9_]/.test(code[j])) j++;
      }
      tokens.push({ type: "type", value: code.slice(i, j) });
      commandPosition = false;
      i = j;
      continue;
    }

    if (char === "&" || char === "|" || char === ";") {
      const maybeDouble = `${char}${code[i + 1] ?? ""}`;
      if (maybeDouble === "&&" || maybeDouble === "||") {
        tokens.push({ type: "punctuation", value: maybeDouble });
        i += 2;
      } else {
        tokens.push({ type: "punctuation", value: char });
        i++;
      }
      commandPosition = true;
      continue;
    }

    if (/[0-9]/.test(char)) {
      let j = i + 1;
      while (j < code.length && /[0-9]/.test(code[j])) j++;
      tokens.push({ type: "number", value: code.slice(i, j) });
      commandPosition = false;
      i = j;
      continue;
    }

    let j = i;
    while (j < code.length && !/[\s"'`$#&|;()]/.test(code[j])) j++;
    const word = code.slice(i, j);

    if (BASH_KEYWORDS.has(word)) {
      tokens.push({ type: "keyword", value: word });
    } else if (commandPosition) {
      tokens.push({ type: "command", value: word });
    } else {
      tokens.push({ type: "plain", value: word });
    }
    commandPosition = false;
    i = j;
  }

  return tokens;
}

function tokenize(code: string, language?: string): Token[] {
  switch (normalizeLanguage(language)) {
    case "json":
      return tokenizeJson(code);
    case "bash":
      return tokenizeBash(code);
    default:
      return tokenizeTsLike(code);
  }
}

const TOKEN_CLASSES: Record<TokenType, string> = {
  keyword: "text-primary",
  string: "text-emerald-400",
  comment: "text-muted-foreground/55 italic",
  type: "text-sky-400",
  function: "text-amber-300",
  number: "text-orange-400",
  punctuation: "text-muted-foreground/70",
  "jsx-tag": "text-cyan-300",
  property: "text-purple-300",
  command: "text-rose-300",
  boolean: "text-fuchsia-300",
  plain: "text-foreground/80",
};

interface SyntaxHighlightProps {
  code: string;
  language?: string;
}

export function SyntaxHighlight({ code, language }: SyntaxHighlightProps) {
  const tokens = tokenize(code, language);

  return (
    <code className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
      {tokens.map((token, i) => (
        <Fragment key={`${token.type}-${i}`}>
          <span className={TOKEN_CLASSES[token.type]}>{token.value}</span>
        </Fragment>
      ))}
    </code>
  );
}
