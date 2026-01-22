import { useRef, useMemo, useEffect } from 'react';

// src/constants.ts
var Platform = {
  MAC: "mac",
  WINDOWS: "windows",
  LINUX: "linux"
};
function detectPlatform() {
  if (typeof navigator === "undefined") return Platform.WINDOWS;
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac")) return Platform.MAC;
  if (platform.includes("linux")) return Platform.LINUX;
  return Platform.WINDOWS;
}
var ModifierKey = {
  META: "meta",
  CTRL: "ctrl",
  ALT: "alt",
  SHIFT: "shift"
};
var ModifierAliases = {
  command: ModifierKey.META,
  cmd: ModifierKey.META,
  "\u2318": ModifierKey.META,
  meta: ModifierKey.META,
  win: ModifierKey.META,
  windows: ModifierKey.META,
  super: ModifierKey.META,
  mod: ModifierKey.META,
  control: ModifierKey.CTRL,
  ctrl: ModifierKey.CTRL,
  "\u2303": ModifierKey.CTRL,
  ctl: ModifierKey.CTRL,
  alt: ModifierKey.ALT,
  option: ModifierKey.ALT,
  opt: ModifierKey.ALT,
  "\u2325": ModifierKey.ALT,
  shift: ModifierKey.SHIFT,
  "\u21E7": ModifierKey.SHIFT,
  shft: ModifierKey.SHIFT
};
var SpecialKeyMap = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
  enter: "Enter",
  return: "Enter",
  space: " ",
  spacebar: " ",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  escape: "Escape",
  esc: "Escape",
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
  f10: "F10",
  f11: "F11",
  f12: "F12",
  plus: "+",
  minus: "-",
  comma: ",",
  period: ".",
  slash: "/",
  backslash: "\\",
  bracket: "[",
  closebracket: "]"
};
var ModifierDisplaySymbols = {
  [Platform.MAC]: {
    [ModifierKey.META]: "\u2318",
    [ModifierKey.CTRL]: "\u2303",
    [ModifierKey.ALT]: "\u2325",
    [ModifierKey.SHIFT]: "\u21E7"
  },
  [Platform.WINDOWS]: {
    [ModifierKey.META]: "Ctrl",
    [ModifierKey.CTRL]: "Ctrl",
    [ModifierKey.ALT]: "Alt",
    [ModifierKey.SHIFT]: "Shift"
  },
  [Platform.LINUX]: {
    [ModifierKey.META]: "Super",
    [ModifierKey.CTRL]: "Ctrl",
    [ModifierKey.ALT]: "Alt",
    [ModifierKey.SHIFT]: "Shift"
  }
};
var ModifierDisplayOrder = {
  [Platform.MAC]: [ModifierKey.CTRL, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.META],
  [Platform.WINDOWS]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL],
  [Platform.LINUX]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL]
};

// src/parser.ts
function parseShortcut(shortcut) {
  const platform = detectPlatform();
  const normalized = shortcut.toLowerCase().trim();
  const parts = normalized.split(/[\s+-]+/).filter(Boolean);
  if (parts.length === 0) {
    throw new Error(`Invalid shortcut: "${shortcut}"`);
  }
  const modifiers = {
    meta: false,
    ctrl: false,
    alt: false,
    shift: false
  };
  let key = parts.pop();
  for (const part of parts) {
    const modifierKey = ModifierAliases[part];
    if (modifierKey) {
      if (part === "mod") {
        if (platform === Platform.MAC) {
          modifiers.meta = true;
        } else {
          modifiers.ctrl = true;
        }
      } else {
        modifiers[modifierKey] = true;
      }
    } else {
      key = part + key;
    }
  }
  const normalizedKey = SpecialKeyMap[key] || key;
  return {
    modifiers,
    key: normalizedKey.length === 1 ? normalizedKey.toLowerCase() : normalizedKey,
    original: shortcut
  };
}
function parseShortcuts(shortcuts) {
  const shortcutArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts];
  return shortcutArray.map(parseShortcut);
}
function getModifiersFromEvent(event) {
  return {
    meta: event.metaKey,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey
  };
}
function matchesShortcut(event, parsed) {
  const eventModifiers = getModifiersFromEvent(event);
  const eventKey = event.key.toLowerCase();
  const modifiersMatch = eventModifiers.meta === parsed.modifiers.meta && eventModifiers.ctrl === parsed.modifiers.ctrl && eventModifiers.alt === parsed.modifiers.alt && eventModifiers.shift === parsed.modifiers.shift;
  const keyMatches = eventKey === parsed.key.toLowerCase();
  return modifiersMatch && keyMatches;
}
function matchesAnyShortcut(event, parsedShortcuts) {
  return parsedShortcuts.some((parsed) => matchesShortcut(event, parsed));
}

// src/formatter.ts
function formatShortcut(shortcut, platform) {
  const targetPlatform = platform ?? detectPlatform();
  const parsed = parseShortcut(shortcut);
  const symbols = ModifierDisplaySymbols[targetPlatform];
  const order = ModifierDisplayOrder[targetPlatform];
  const parts = [];
  for (const modifier of order) {
    if (parsed.modifiers[modifier]) {
      parts.push(symbols[modifier]);
    }
  }
  const displayKey = formatKey(parsed.key, targetPlatform);
  parts.push(displayKey);
  const separator = targetPlatform === Platform.MAC ? "" : "+";
  return parts.join(separator);
}
function formatKey(key, platform) {
  const displayNames = {
    ArrowUp: "\u2191",
    ArrowDown: "\u2193",
    ArrowLeft: "\u2190",
    ArrowRight: "\u2192",
    Enter: platform === Platform.MAC ? "\u21A9" : "Enter",
    Tab: platform === Platform.MAC ? "\u21E5" : "Tab",
    Escape: platform === Platform.MAC ? "\u238B" : "Esc",
    Backspace: platform === Platform.MAC ? "\u232B" : "Backspace",
    Delete: platform === Platform.MAC ? "\u2326" : "Del",
    " ": platform === Platform.MAC ? "\u2423" : "Space",
    Home: "Home",
    End: "End",
    PageUp: "PgUp",
    PageDown: "PgDn"
  };
  return displayNames[key] || key.toUpperCase();
}
function getModifierSymbols(platform) {
  const targetPlatform = platform ?? detectPlatform();
  return ModifierDisplaySymbols[targetPlatform];
}

// src/builder.ts
var MODIFIER_KEYS = /* @__PURE__ */ new Set(["ctrl", "shift", "alt", "cmd", "mod"]);
var IGNORED_TAGS = /* @__PURE__ */ new Set(["INPUT", "TEXTAREA", "SELECT"]);
var EXCEPT_PREDICATES = {
  input: (e) => {
    const target = e.target;
    return IGNORED_TAGS.has(target.tagName);
  },
  editable: (e) => {
    const target = e.target;
    return target.isContentEditable;
  },
  typing: (e) => {
    const target = e.target;
    return IGNORED_TAGS.has(target.tagName) || target.isContentEditable;
  },
  modal: () => {
    return document.querySelector('[data-modal="true"], [role="dialog"]') !== null;
  },
  disabled: (e) => {
    const target = e.target;
    return target.hasAttribute("disabled") || target.getAttribute("aria-disabled") === "true";
  }
};
function shouldExcept(event, except) {
  if (!except) return false;
  if (typeof except === "function") {
    return except(event);
  }
  if (Array.isArray(except)) {
    return except.some((preset) => EXCEPT_PREDICATES[preset]?.(event));
  }
  return EXCEPT_PREDICATES[except]?.(event) ?? false;
}
function getActiveModifierTokens(modifiers) {
  const platform = detectPlatform();
  const order = ModifierDisplayOrder[platform];
  return order.filter((key) => {
    if (key === ModifierKey.CTRL) return modifiers.ctrl;
    if (key === ModifierKey.ALT) return modifiers.alt;
    if (key === ModifierKey.SHIFT) return modifiers.shift;
    if (key === ModifierKey.META) return modifiers.cmd;
    return false;
  }).map((key) => {
    if (key === ModifierKey.CTRL) return "ctrl";
    if (key === ModifierKey.ALT) return "alt";
    if (key === ModifierKey.SHIFT) return "shift";
    if (key === ModifierKey.META) return "cmd";
    return "";
  });
}
function buildComboString(modifiers, key) {
  const tokens = getActiveModifierTokens(modifiers);
  return [...tokens, key].join("+");
}
function formatCombo(modifiers, key) {
  const platform = detectPlatform();
  const symbols = ModifierDisplaySymbols[platform];
  const tokens = getActiveModifierTokens(modifiers);
  const parts = tokens.map((t) => {
    if (t === "ctrl") return symbols[ModifierKey.CTRL];
    if (t === "alt") return symbols[ModifierKey.ALT];
    if (t === "shift") return symbols[ModifierKey.SHIFT];
    if (t === "cmd") return symbols[ModifierKey.META];
    return t;
  });
  parts.push(key.length === 1 ? key.toUpperCase() : key);
  return platform === Platform.MAC ? parts.join("") : parts.join("+");
}
function debugLog(debug, ...args) {
  if (debug) {
    console.log("[useShortcut]", ...args);
  }
}
function createBinding(state, handler, handlerOptions = {}, registry) {
  const { modifiers, key, options, except: stateExcept } = state;
  if (!key) {
    throw new Error("[useShortcut] No key specified. Use .key() to set the action key.");
  }
  const combo = buildComboString(modifiers, key);
  const display = formatCombo(modifiers, key);
  const parsed = parseShortcut(combo);
  const debug = options.debug ?? false;
  const except = stateExcept ?? handlerOptions.except;
  const existing = registry.listeners.get(combo);
  if (existing) {
    debugLog(debug, "Updating existing shortcut handler:", combo);
    existing.userHandler = handler;
    return {
      unbind: existing.unbind,
      display,
      combo,
      trigger: () => existing.userHandler(new KeyboardEvent("keydown")),
      get isEnabled() {
        return existing.isEnabled;
      },
      enable: () => {
        existing.isEnabled = true;
      },
      disable: () => {
        existing.isEnabled = false;
      },
      onAttempt: (callback) => {
        existing.attemptCallbacks.add(callback);
        return () => existing.attemptCallbacks.delete(callback);
      }
    };
  }
  const isEnabled = !handlerOptions.disabled && !options.disabled;
  const delay = handlerOptions.delay ?? options.delay ?? 0;
  const attemptCallbacks = /* @__PURE__ */ new Set();
  debugLog(debug, "Registering:", combo, "\u2192", display, { modifiers, key, parsed, except: !!except });
  function handleEvent(event) {
    const entry = registry.listeners.get(combo);
    if (!entry?.isEnabled) return;
    if (options.ignoreInputs !== false && !except) {
      const target2 = event.target;
      if (IGNORED_TAGS.has(target2.tagName) || target2.isContentEditable) {
        return;
      }
    }
    if (shouldExcept(event, except)) {
      debugLog(debug, "Skipped due to except condition:", combo);
      return;
    }
    debugLog(debug, "Key pressed:", event.key, {
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey
    });
    const matched = matchesShortcut(event, parsed);
    entry.attemptCallbacks.forEach((cb) => cb(matched, event));
    if (matched) {
      debugLog(debug, "MATCHED:", combo, "\u2192", display);
      if (handlerOptions.preventDefault !== false) {
        event.preventDefault();
      }
      if (handlerOptions.stopPropagation) {
        event.stopPropagation();
      }
      const executeHandler = () => entry.userHandler(event);
      if (delay > 0) {
        debugLog(debug, "Delaying execution by", delay, "ms");
        setTimeout(executeHandler, delay);
      } else {
        executeHandler();
      }
    }
  }
  const target = options.target ?? (typeof window !== "undefined" ? window : null);
  const eventType = options.eventType ?? "keydown";
  if (target) {
    target.addEventListener(eventType, handleEvent);
    debugLog(debug, "Listener attached for:", combo);
  }
  function unbind() {
    if (target) {
      target.removeEventListener(eventType, handleEvent);
      registry.listeners.delete(combo);
      debugLog(debug, "Unregistered:", combo);
    }
  }
  registry.listeners.set(combo, {
    listener: handleEvent,
    userHandler: handler,
    unbind,
    isEnabled,
    attemptCallbacks
  });
  return {
    unbind,
    display,
    combo,
    trigger: () => handler(new KeyboardEvent(eventType)),
    get isEnabled() {
      return registry.listeners.get(combo)?.isEnabled ?? false;
    },
    enable: () => {
      const entry = registry.listeners.get(combo);
      if (entry) entry.isEnabled = true;
    },
    disable: () => {
      const entry = registry.listeners.get(combo);
      if (entry) entry.isEnabled = false;
    },
    onAttempt: (callback) => {
      const entry = registry.listeners.get(combo);
      if (entry) {
        entry.attemptCallbacks.add(callback);
        return () => entry.attemptCallbacks.delete(callback);
      }
      return () => {
      };
    }
  };
}
function createShortcutBuilder(options = {}) {
  const registry = {
    listeners: /* @__PURE__ */ new Map(),
    options
  };
  debugLog(options.debug, "Builder created with options:", options);
  function createProxy(currentState) {
    return new Proxy({}, {
      get(_, prop) {
        if (prop === "__debug") {
          return currentState.options.debug;
        }
        if (MODIFIER_KEYS.has(prop)) {
          const platform = detectPlatform();
          const modKey = prop === "mod" ? platform === Platform.MAC ? "cmd" : "ctrl" : prop;
          const newState = {
            ...currentState,
            modifiers: { ...currentState.modifiers, [modKey]: true }
          };
          debugLog(currentState.options.debug, `Chain: +${prop} \u2192`, newState.modifiers);
          return createProxy(newState);
        }
        if (prop === "key") {
          return (key) => {
            const newState = {
              ...currentState,
              key
            };
            debugLog(currentState.options.debug, `Chain: .key("${key}")`);
            return createProxy(newState);
          };
        }
        if (prop === "except") {
          return (condition) => {
            const newState = {
              ...currentState,
              except: condition
            };
            debugLog(currentState.options.debug, `Chain: .except()`, condition);
            return createProxy(newState);
          };
        }
        if (prop === "on") {
          return (handler, handlerOptions) => {
            return createBinding(currentState, handler, handlerOptions, registry);
          };
        }
        if (prop === "handle") {
          return (opts) => {
            const { handler, ...rest } = opts;
            return createBinding(currentState, handler, rest, registry);
          };
        }
        return void 0;
      }
    });
  }
  const initialState = {
    modifiers: {},
    key: null,
    options
  };
  return {
    builder: createProxy(initialState),
    registry
  };
}

// src/hook.ts
function useShortcut(options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const { builder, registry } = useMemo(() => {
    return createShortcutBuilder(optionsRef.current);
  }, []);
  useEffect(() => {
    registry.options = optionsRef.current;
  });
  useEffect(() => {
    return () => {
      registry.listeners.forEach((entry) => entry.unbind());
      registry.listeners.clear();
    };
  }, [registry]);
  return builder;
}
function createShortcut(options = {}) {
  const { builder } = createShortcutBuilder(options);
  return builder;
}

export { ModifierAliases, ModifierDisplayOrder, ModifierDisplaySymbols, ModifierKey, Platform, SpecialKeyMap, createShortcut, detectPlatform, formatShortcut, getModifierSymbols, getModifiersFromEvent, matchesAnyShortcut, matchesShortcut, parseShortcut, parseShortcuts, useShortcut };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map