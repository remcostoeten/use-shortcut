import type { PackageConfig } from "../types";
import {
  detectPlatform,
  formatShortcut,
  parseShortcut,
  parseShortcuts,
} from "@remcostoeten/use-shortcut";
import { getPackageDocsUrl } from "../site";

const activePlatform = detectPlatform();
const stringifyResult = (value: unknown) => JSON.stringify(value, null, 2);
const parsedSingle = parseShortcut("mod+shift+p");
const parsedMultiple = parseShortcuts(["mod+s", "escape"]);

const useShortcutConfig: PackageConfig = {
  slug: "use-shortcut",
  packageName: "use-shortcut",
  installName: "@remcostoeten/use-shortcut",
  tagline: "@remcostoeten",
  description: "a tiny react hook for keyboard shortcuts that feels fluent, stays fully typed, and scales from one save shortcut to full command palettes, sequences, and scoped app navigation.",
  heroSubcopy: "built for real product flows: save actions, editor shortcuts, layered scopes, and fast keyboard-first navigation.",
  heroTitle: "use-shortcut",
  bundleSizeKb: 3,

  author: {
    name: "Remco Stoeten",
    handle: "@remcostoeten",
    url: "https://github.com/remcostoeten",
  },

  navLinks: [
    { label: "setup", url: "#install" },
    { label: "example", url: "#demo" },
    { label: "recipes", url: "#syntax" },
    { label: "options", url: "#api" },
    { label: "api reference", url: "#api-reference" },
    { label: "api matrix", url: "#api-matrix" },
  ],

  links: {
    npm: "https://www.npmjs.com/package/@remcostoeten/use-shortcut",
    github: "https://github.com/remcostoeten/use-shortcut",
    docs: getPackageDocsUrl("use-shortcut"),
  },

  why: {
    paragraphs: [
      "chainable api, sequences, scopes, and conflict checks in ~3kb with zero dependencies.",
    ],
  },

  features: [
    { value: "~3kb", label: "zero dependencies", description: "only react as peer dep. tiny bundle." },
    { value: "chain", label: "chainable api", description: "$.cmd.shift.key('s').on(() => save())" },
    { value: "ts", label: "perfect typescript", description: "intellisense at every step of the chain." },
    { value: "seq", label: "sequences & chords", description: "multi-step bindings like $.key('g').then('d')" },
    { value: "scope", label: "named scopes", description: "activate/deactivate shortcut contexts." },
    { value: "⌘/ctrl", label: "cross-platform", description: "mod = ⌘ on mac, ctrl on windows/linux." },
  ],

  apiProps: [
    { name: "debug", type: "boolean", default: "false", description: "log shortcut evaluation details to console." },
    { name: "delay", type: "number", default: "0", description: "global delay for all handlers in ms." },
    { name: "ignoreInputs", type: "boolean", default: "true", description: "ignore shortcuts in input/textarea/select by default." },
    { name: "target", type: "HTMLElement | Window | null", default: "window", description: "listener target for keyboard events." },
    { name: "eventType", type: '"keydown" | "keyup"', default: '"keydown"', description: "keyboard event type to bind." },
    { name: "disabled", type: "boolean", default: "false", description: "disable all shortcuts for this hook instance." },
    { name: "activeScopes", type: "string | string[]", default: "—", description: "currently active scope names." },
    { name: "sequenceTimeout", type: "number", default: "800", description: "ms allowed between sequence steps." },
    { name: "conflictWarnings", type: "boolean", default: "true", description: "warn on exact/prefix collisions." },
    { name: "onConflict", type: "(conflict) => void", default: "—", description: "custom conflict callback." },
    { name: "eventFilter", type: "(event) => boolean", default: "—", description: "global event allow/deny hook." },
  ],

  apiPropGuidance: [
    {
      prop: "debug",
      guidance: "turn this on while building or debugging shortcut chains.",
      whenToUse: "you want to inspect matching, except checks, or scope decisions in the console.",
      example: `const $ = useShortcut({ debug: true })`,
      exampleLanguage: "ts",
    },
    {
      prop: "delay",
      guidance: "adds a global delay before each handler runs.",
      whenToUse: "you want small debounce-like spacing between key press and side effect.",
      example: `const $ = useShortcut({ delay: 120 })`,
      exampleLanguage: "ts",
    },
    {
      prop: "ignoreInputs",
      guidance: "controls whether typing fields are skipped by default.",
      whenToUse: "set false when your app intentionally supports shortcuts inside inputs.",
      example: `const $ = useShortcut({ ignoreInputs: false })`,
      exampleLanguage: "ts",
    },
    {
      prop: "target",
      guidance: "changes where keyboard listeners are attached.",
      whenToUse: "scope listeners to a specific container like an editor or modal root.",
      example: `const editorRoot = document.getElementById("editor-root")
const $ = useShortcut({ target: editorRoot })`,
      exampleLanguage: "ts",
    },
    {
      prop: "eventType",
      guidance: "chooses keydown or keyup matching globally.",
      whenToUse: "prefer keyup when keydown conflicts with browser/native behavior.",
      example: `const $ = useShortcut({ eventType: "keyup" })`,
      exampleLanguage: "ts",
    },
    {
      prop: "disabled",
      guidance: "disables all bindings created by this hook instance.",
      whenToUse: "temporarily pause shortcuts during onboarding, modals, or blocking flows.",
      example: `const [paused, setPaused] = useState(false)
const $ = useShortcut({ disabled: paused })`,
      exampleLanguage: "tsx",
    },
    {
      prop: "activeScopes",
      guidance: "sets initial active scope names at hook creation.",
      whenToUse: "your app has context-specific shortcuts like navigation vs editor.",
      example: `const $ = useShortcut({ activeScopes: ["navigation"] })
$.in("editor").mod.key("s").on(saveFile)`,
      exampleLanguage: "tsx",
    },
    {
      prop: "sequenceTimeout",
      guidance: "sets max time between sequence steps.",
      whenToUse: "users need more or less time to finish multi-step combos.",
      example: `const $ = useShortcut({ sequenceTimeout: 1200 })
$.key("g").then("d").on(goToDashboard)`,
      exampleLanguage: "tsx",
    },
    {
      prop: "conflictWarnings",
      guidance: "controls whether exact and prefix conflicts are warned.",
      whenToUse: "disable in controlled production environments with pre-validated bindings.",
      example: `const $ = useShortcut({ conflictWarnings: false })`,
      exampleLanguage: "ts",
    },
    {
      prop: "onConflict",
      guidance: "receives conflict metadata whenever overlap is detected.",
      whenToUse: "pipe conflicts into your own telemetry, toasts, or dev tooling.",
      example: `const $ = useShortcut({
  onConflict: (conflict) => {
    console.warn("shortcut conflict", conflict)
  },
})`,
      exampleLanguage: "tsx",
    },
    {
      prop: "eventFilter",
      guidance: "central allow/deny predicate for every keyboard event.",
      whenToUse: "block shortcuts in app-specific states like locked screens or IME composition.",
      example: `const $ = useShortcut({
  eventFilter: (event) => !event.isComposing && !event.repeat,
})`,
      exampleLanguage: "tsx",
    },
  ],

  apiCapabilities: [
    {
      name: "useShortcut",
      kind: "function",
      summary: "Creates the chainable shortcut builder hook.",
      possible: "Register combos, sequences, scopes, except guards, and recording flows from one API.",
      example: 'const $ = useShortcut({ activeScopes: ["editor"] })\n$.mod.key("s").on(() => save())',
      exampleLanguage: "tsx",
    },
    {
      name: "formatShortcut",
      kind: "function",
      summary: "Formats shortcut strings for UI display.",
      possible: "Render cross-platform labels like ⌘S or Ctrl+S in menus and hints.",
      example: 'const label = formatShortcut("mod+s")',
      exampleLanguage: "ts",
      result: stringifyResult(formatShortcut("mod+s")),
      resultLanguage: "json",
    },
    {
      name: "detectPlatform",
      kind: "function",
      summary: "Resolves the active platform token.",
      possible: "Branch platform UI behavior between mac, windows, and linux.",
      example: "const platform = detectPlatform()",
      exampleLanguage: "ts",
      result: stringifyResult(activePlatform),
      resultLanguage: "json",
    },
    {
      name: "parseShortcut",
      kind: "function",
      summary: "Parses one shortcut expression.",
      possible: "Convert string syntax into normalized modifier/key structure.",
      example: 'const parsed = parseShortcut("mod+shift+p")',
      exampleLanguage: "ts",
      result: stringifyResult(parsedSingle),
      resultLanguage: "json",
    },
    {
      name: "parseShortcuts",
      kind: "function",
      summary: "Parses one or many shortcut expressions.",
      possible: "Build parsed arrays for custom match pipelines.",
      example: 'const list = parseShortcuts(["mod+s", "escape"])',
      exampleLanguage: "ts",
      result: stringifyResult(parsedMultiple),
      resultLanguage: "json",
    },
    {
      name: "matchesShortcut",
      kind: "function",
      summary: "Matches a keyboard event against one parsed shortcut.",
      possible: "Run custom event listeners with reusable parser output.",
      example: "if (matchesShortcut(event, parsed)) save()",
      exampleLanguage: "ts",
    },
    {
      name: "matchesAnyShortcut",
      kind: "function",
      summary: "Matches a keyboard event against parsed shortcut arrays.",
      possible: "Trigger one branch when any tracked shortcut is pressed.",
      example: "if (matchesAnyShortcut(event, parsedList)) openPalette()",
      exampleLanguage: "ts",
    },
    { name: "ModifierKey", kind: "constant", summary: "Canonical modifier key constants.", possible: "Reference stable modifier identifiers in custom type-safe logic." },
    { name: "ModifierAliases", kind: "constant", summary: "Alias map for modifier token normalization.", possible: "Normalize custom user input like cmd/command/win into canonical modifier names." },
    { name: "SpecialKeyMap", kind: "constant", summary: "Alias map for special key tokens.", possible: "Map esc/spacebar/up/etc. into KeyboardEvent-compatible keys." },
    { name: "ModifierDisplaySymbols", kind: "constant", summary: "Platform symbol/label map for modifiers.", possible: "Build custom shortcut chips and legends with native symbols." },
    { name: "ModifierDisplayOrder", kind: "constant", summary: "Platform display ordering for modifiers.", possible: "Render modifier stacks in native order per OS." },
    { name: "Platform", kind: "constant", summary: "Platform constant bag (MAC/WINDOWS/LINUX).", possible: "Use stable platform constants in conditionals and formatting logic." },
    { name: "ActionKey", kind: "type", summary: "Union of valid `.key(...)` values.", possible: "Type helper for key-safe abstractions built around the builder." },
    { name: "AlphaKey", kind: "type", summary: "a-z key subset type.", possible: "Constrain APIs to letter shortcuts only." },
    { name: "NumericKey", kind: "type", summary: "0-9 key subset type.", possible: "Constrain APIs to numeric shortcuts." },
    { name: "FunctionKey", kind: "type", summary: "F1-F12 key subset type.", possible: "Constrain APIs to function key shortcuts." },
    { name: "NavigationKey", kind: "type", summary: "Arrow/home/end/page key subset type.", possible: "Constrain APIs to navigation shortcuts." },
    { name: "SpecialKey", kind: "type", summary: "Special action keys (enter/esc/tab/etc.).", possible: "Constrain APIs to action-style keys." },
    { name: "SymbolKey", kind: "type", summary: "Symbol/punctuation key subset type.", possible: "Constrain APIs to symbol shortcuts." },
    { name: "ModifierName", kind: "type", summary: "Modifier token union.", possible: "Type-safe token handling for modifier-specific utilities." },
    { name: "ModifierFlags", kind: "type", summary: "Builder-style modifier boolean shape.", possible: "Represent ctrl/shift/alt/cmd state for internal composition logic." },
    { name: "ModifierState", kind: "type", summary: "Event-style modifier boolean shape.", possible: "Represent meta/ctrl/alt/shift state in parser and matcher flows." },
    { name: "ParsedShortcut", kind: "type", summary: "Parser output shape.", possible: "Persist or inspect normalized shortcut structures in custom tooling." },
    { name: "ShortcutBuilder", kind: "type", summary: "Type for the chain builder returned by useShortcut.", possible: "Type wrapper utilities and reusable shortcut modules." },
    { name: "ShortcutResult", kind: "type", summary: "Handle returned by shortcut registration.", possible: "Unbind, enable/disable, trigger, and inspect registered shortcuts." },
    { name: "ShortcutHandler", kind: "type", summary: "Keyboard handler callback type.", possible: "Type callbacks that handle shortcut KeyboardEvent objects." },
    { name: "HandlerOptions", kind: "type", summary: "Per-shortcut behavior options.", possible: "Tune preventDefault, priority, scope, except conditions, and timing." },
    { name: "UseShortcutOptions", kind: "type", summary: "Hook-level runtime options.", possible: "Set global behavior for targets, filtering, scope activation, and conflicts." },
    { name: "ModifierChain", kind: "type", summary: "Intermediate chain type after modifiers.", possible: "Build advanced type-safe wrappers around modifier composition." },
    { name: "KeyChain", kind: "type", summary: "Chain type after key selection.", possible: "Type follow-up methods like on/then/except/in for custom helpers." },
    { name: "ExceptPreset", kind: "type", summary: "Built-in except condition presets.", possible: "Use input/editable/typing/modal/disabled predicates without custom logic." },
    { name: "ExceptPredicate", kind: "type", summary: "Custom except predicate type.", possible: "Inject your own skip conditions per event and UI state." },
    { name: "ShortcutScope", kind: "type", summary: "Scope token type.", possible: "Namespace shortcut activation into app contexts like editor or modal." },
    { name: "ShortcutConflict", kind: "type", summary: "Conflict callback payload type.", possible: "Inspect exact/prefix overlap metadata when conflicts are detected." },
    { name: "ShortcutRecordingOptions", kind: "type", summary: "Recording config shape.", possible: "Control recording target/event type/timeout in key capture UIs." },
  ],

  apiMethodGroups: [
    {
      title: "shortcutbuilder (from useShortcut)",
      description: "Top-level chain entrypoint and runtime controls.",
      methods: [
        { name: "ctrl", signature: "$.ctrl", description: "Adds ctrl modifier to the current chain." },
        { name: "shift", signature: "$.shift", description: "Adds shift modifier to the current chain." },
        { name: "alt", signature: "$.alt", description: "Adds alt modifier to the current chain." },
        { name: "cmd", signature: "$.cmd", description: "Adds command/meta modifier to the current chain." },
        { name: "mod", signature: "$.mod", description: "Adds platform-aware modifier (⌘ on mac, ctrl otherwise)." },
        { name: "key", signature: "$.key(actionKey)", description: "Starts a key chain by selecting the first step key." },
        { name: "in", signature: "$.in(scopes)", description: "Sets required scopes for the current chain segment." },
        { name: "setScopes", signature: "$.setScopes(scopes)", description: "Replaces active scopes at runtime." },
        { name: "enableScope", signature: "$.enableScope(scope)", description: "Enables one scope name." },
        { name: "disableScope", signature: "$.disableScope(scope)", description: "Disables one scope name." },
        { name: "getScopes", signature: "$.getScopes()", description: "Returns the currently active scopes." },
        { name: "isScopeActive", signature: "$.isScopeActive(scope)", description: "Checks whether a scope is active." },
        { name: "record", signature: "$.record(options?)", description: "Records the next non-modifier shortcut combo." },
      ],
    },
    {
      title: "keychain (after .key(...))",
      description: "Methods available after selecting a key step.",
      methods: [
        { name: "on", signature: ".on(handler, options?)", description: "Registers the shortcut handler and returns ShortcutResult." },
        { name: "handle", signature: ".handle({ handler, ...options })", description: "Registers with inline handler/options object." },
        { name: "except", signature: ".except(condition)", description: "Adds skip conditions via presets or predicate." },
        { name: "in", signature: ".in(scopes)", description: "Applies required scopes to this binding." },
        { name: "then", signature: ".then(nextStep)", description: "Adds another sequence step (supports modified steps)." },
      ],
    },
    {
      title: "keychainwithexcept (after .except(...))",
      description: "Chain state with except pre-applied.",
      methods: [
        { name: "on", signature: ".on(handler, optionsWithoutExcept?)", description: "Registers with except already locked in." },
        { name: "in", signature: ".in(scopes)", description: "Adds required scopes." },
        { name: "then", signature: ".then(nextStep)", description: "Continues a sequence while preserving except condition." },
      ],
    },
    {
      title: "shortcutresult (returned from registration)",
      description: "Runtime handle for controlling/inspecting a binding.",
      methods: [
        { name: "unbind", signature: "result.unbind()", description: "Removes this shortcut binding." },
        { name: "display", signature: "result.display", description: "Human display label for the combo (platform-aware)." },
        { name: "combo", signature: "result.combo", description: "Normalized combo string." },
        { name: "trigger", signature: "result.trigger()", description: "Programmatically executes the handler." },
        { name: "isEnabled", signature: "result.isEnabled", description: "Current enabled state flag." },
        { name: "enable", signature: "result.enable()", description: "Enables this shortcut." },
        { name: "disable", signature: "result.disable()", description: "Disables this shortcut." },
        { name: "onAttempt", signature: "result.onAttempt?.(callback)", description: "Subscribes to attempt events and matched state." },
      ],
    },
    {
      title: "utility functions",
      description: "Non-hook helpers exported from the package.",
      methods: [
        { name: "formatShortcut", signature: "formatShortcut(shortcut, platform?)", description: "Formats shortcut display strings." },
        { name: "detectPlatform", signature: "detectPlatform()", description: "Returns current platform token." },
        { name: "parseShortcut", signature: "parseShortcut(shortcut)", description: "Parses one shortcut expression." },
        { name: "parseShortcuts", signature: "parseShortcuts(shortcuts)", description: "Parses one or many shortcut expressions." },
        { name: "matchesShortcut", signature: "matchesShortcut(event, parsed)", description: "Matches event against one parsed shortcut." },
        { name: "matchesAnyShortcut", signature: "matchesAnyShortcut(event, parsedList)", description: "Matches event against multiple parsed shortcuts." },
      ],
    },
  ],

  apiOptionGroups: [
    {
      title: "UseShortcutOptions",
      description: "Hook-level runtime options passed to useShortcut(options).",
      options: [
        { name: "debug", type: "boolean", default: "false", description: "Enable debug logging to console." },
        { name: "delay", type: "number", default: "0", description: "Global delay in ms before handlers execute." },
        { name: "ignoreInputs", type: "boolean", default: "true", description: "Skip shortcuts in input/textarea/select contexts." },
        { name: "target", type: "HTMLElement | Window | null", default: "window", description: "DOM target to attach keyboard listeners to." },
        { name: "eventType", type: "\"keydown\" | \"keyup\"", default: "\"keydown\"", description: "Keyboard event to listen for." },
        { name: "disabled", type: "boolean", default: "false", description: "Disable all shortcuts for this hook instance." },
        { name: "activeScopes", type: "string | string[]", default: "—", description: "Active scope names used for scoped bindings." },
        { name: "sequenceTimeout", type: "number", default: "800", description: "Default timeout in ms for sequence completion." },
        { name: "conflictWarnings", type: "boolean", default: "true", description: "Warn on exact and sequence-prefix collisions." },
        { name: "onConflict", type: "(conflict: ShortcutConflict) => void", default: "—", description: "Custom callback invoked on conflicts." },
        { name: "eventFilter", type: "(event: KeyboardEvent) => boolean", default: "—", description: "Global predicate to allow/deny event processing." },
      ],
      usageExample: `import { useShortcut } from "@remcostoeten/use-shortcut"

const $ = useShortcut({
  debug: false,
  ignoreInputs: true,
  eventType: "keydown",
  activeScopes: ["editor", "global"],
  sequenceTimeout: 900,
  eventFilter: (event) => !event.repeat,
})`,
    },
    {
      title: "HandlerOptions",
      description: "Per-binding options passed to .on(handler, options).",
      options: [
        { name: "preventDefault", type: "boolean", default: "true", description: "Prevent browser default action." },
        { name: "stopPropagation", type: "boolean", default: "false", description: "Stop event bubbling after a match." },
        { name: "delay", type: "number", default: "0", description: "Delay this handler by N ms." },
        { name: "description", type: "string", default: "—", description: "Human description for tooling/debug context." },
        { name: "disabled", type: "boolean", default: "false", description: "Disable this specific binding." },
        { name: "except", type: "ExceptPreset | ExceptPreset[] | ExceptPredicate", default: "—", description: "Skip condition presets or predicate." },
        { name: "scopes", type: "ShortcutScope", default: "—", description: "Required active scopes for this binding." },
        { name: "sequenceTimeout", type: "number", default: "800", description: "Sequence timeout override for this binding." },
        { name: "priority", type: "number", default: "0", description: "Higher number executes first when multiple bindings match." },
        { name: "stopOnMatch", type: "boolean", default: "false", description: "Stop evaluating lower-priority handlers after match." },
      ],
      usageExample: `$.mod.key("s").on(
  (event) => {
    event.preventDefault()
    saveDocument()
  },
  {
    preventDefault: true,
    scopes: ["editor"],
    except: ["input", "modal"],
    priority: 10,
    stopOnMatch: true,
    description: "save active editor document",
  }
)`,
    },
    {
      title: "ShortcutRecordingOptions",
      description: "Options for $.record(options).",
      options: [
        { name: "target", type: "HTMLElement | Window | null", default: "useShortcut target", description: "Target element for recording listener." },
        { name: "eventType", type: "\"keydown\" | \"keyup\"", default: "\"keydown\"", description: "Event type used while recording." },
        { name: "timeoutMs", type: "number", default: "—", description: "Timeout after which recording rejects." },
      ],
      usageExample: `const combo = await $.record({
  eventType: "keydown",
  timeoutMs: 5000,
})

setUserShortcut(combo)`,
    },
  ],

  codeExamples: [
    {
      title: "quick start",
      description: "Use this when you want the smallest possible starter: one save shortcut and one escape hatch, with no app-shell wiring yet.",
      code: `import { useShortcut } from "@remcostoeten/use-shortcut"

function App() {
  const $ = useShortcut()

  $.shift.key("s").on(() => saveDraft())
  $.key("escape").on(() => closePanel())

  return <div>press Shift+S or Esc</div>
}`,
      language: "tsx",
    },
    {
      title: "sequences & chords",
      description: "Use sequences when one-key shortcuts are crowded and you want memorable, low-conflict navigation flows.",
      code: `// github-style: press g, then d
$.key("g").then("d").on(() => goToDashboard())

// steps can include modifiers too
$.key("g").then("shift+d").on(() => openDebug())`,
      language: "tsx",
    },
    {
      title: "named scopes",
      description: "Use scopes when different parts of the UI need different bindings (editor vs navigation). It prevents accidental global collisions.",
      code: `const $ = useShortcut({ activeScopes: "navigation" })

$.in("navigation").key("g").then("d").on(() => goToDashboard())
$.in("editor").mod.key("s").on(() => saveFile())

$.setScopes("editor")
$.enableScope("navigation")`,
      language: "tsx",
    },
    {
      title: "parser + matcher utilities",
      description: "Use parser/matcher utilities when shortcuts come from user config or a backend and you need custom event pipelines outside the chain API.",
      code: `import { parseShortcuts, matchesAnyShortcut } from "@remcostoeten/use-shortcut"

const parsed = parseShortcuts(["mod+s", "escape"])

window.addEventListener("keydown", (event) => {
  if (matchesAnyShortcut(event, parsed)) {
    console.log("tracked shortcut triggered")
  }
})`,
      language: "tsx",
    },
    {
      title: "record a user shortcut",
      description: "A solid settings-screen pattern: capture the combo, preview it immediately, and save only after the user confirms it.",
      code: `const [pendingShortcut, setPendingShortcut] = useState("")
const [savedShortcut, setSavedShortcut] = useState("shift+slash")
const [isRecording, setIsRecording] = useState(false)

async function captureShortcut() {
  setIsRecording(true)
  try {
    const combo = await $.record({ timeoutMs: 5000 }) // e.g. "shift+slash"
    setPendingShortcut(combo)
  } catch {
    toast("capture timed out")
  } finally {
    setIsRecording(false)
  }
}

function saveShortcut() {
  if (!pendingShortcut) return
  setSavedShortcut(pendingShortcut)
  toast("shortcut saved")
}

// render
// <button onClick={captureShortcut}>record shortcut</button>
// <p>saved: {savedShortcut}</p>
// <p>pending: {pendingShortcut || "waiting for capture..."}</p>
// <button onClick={saveShortcut} disabled={!pendingShortcut || isRecording}>save</button>

$.key(savedShortcut).except("typing").on(() => toggleHelp())`,
      language: "tsx",
    },
    {
      title: "install (cli)",
      description: "Use these commands intentionally: install adds runtime only, init copies starter wiring, scaffold generates a fuller typed shortcut architecture.",
      code: `npm install @remcostoeten/use-shortcut

# installs the runtime package only (no files generated)

# copy-paste starter (shadcn-style)
npx @remcostoeten/use-shortcut init
# adds starter files/config so you can register shortcuts quickly

# scaffold full architecture
npx @remcostoeten/use-shortcut scaffold
# generates a larger typed setup (scopes/registry/modules)`,
      language: "bash",
    },
  ],

  uiUseCases: [
    {
      id: "quick-start",
      title: "quick start",
      summary: "a tiny starter with one save shortcut and one escape action.",
      whenToUse: "you want to prove the hook works before designing broader app-level shortcut flows.",
      actions: [
        { label: "save draft", shortcut: "shift+s" },
        { label: "dismiss active panel", shortcut: "escape" },
      ],
      notes: [
        "use a non-browser combo like shift+s when you want a friction-free first test.",
        "start small, then graduate to app-shell shortcuts once the basics feel right.",
      ],
    },
  ],
};

export default useShortcutConfig;
