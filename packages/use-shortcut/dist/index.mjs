import { useRef, useMemo, useEffect, useState } from 'react';

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
function normalizeScopes(scopes) {
  if (!scopes) return [];
  return (Array.isArray(scopes) ? scopes : [scopes]).map((scope) => scope.trim()).filter(Boolean);
}
function scopeMatch(requiredScopes, activeScopes) {
  if (requiredScopes.size === 0) return true;
  for (const required of requiredScopes) {
    if (activeScopes.has(required)) return true;
  }
  return false;
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
function formatSequenceDisplay(steps) {
  return steps.map((step) => formatShortcut(step)).join(" then ");
}
function debugLog(debug, ...args) {
  if (debug) {
    console.log("[useShortcut]", ...args);
  }
}
function canonicalizeParsed(parsed) {
  const modifiers = [];
  if (parsed.modifiers.ctrl) modifiers.push("ctrl");
  if (parsed.modifiers.alt) modifiers.push("alt");
  if (parsed.modifiers.shift) modifiers.push("shift");
  if (parsed.modifiers.meta) modifiers.push("cmd");
  return [...modifiers, parsed.key.toLowerCase()].join("+");
}
function isPureModifier(event) {
  const key = event.key.toLowerCase();
  return key === "shift" || key === "control" || key === "alt" || key === "meta";
}
function eventToCombo(event) {
  const modifiers = [];
  if (event.ctrlKey) modifiers.push("ctrl");
  if (event.altKey) modifiers.push("alt");
  if (event.shiftKey) modifiers.push("shift");
  if (event.metaKey) modifiers.push("cmd");
  const key = event.key === " " ? "space" : event.key.toLowerCase();
  return [...modifiers, key].join("+");
}
function isPrefix(a, b) {
  if (a.length > b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (canonicalizeParsed(a[i]) !== canonicalizeParsed(b[i])) {
      return false;
    }
  }
  return true;
}
function detectConflict(newSteps, existingSteps) {
  const newCombo = newSteps.map(canonicalizeParsed).join(" ");
  const existingCombo = existingSteps.map(canonicalizeParsed).join(" ");
  if (newCombo === existingCombo) return "exact";
  if (isPrefix(newSteps, existingSteps) || isPrefix(existingSteps, newSteps)) {
    return "sequence-prefix";
  }
  return null;
}
function emitConflict(registry, conflict) {
  const conflictWarnings = registry.options.conflictWarnings ?? true;
  if (registry.options.onConflict) {
    registry.options.onConflict(conflict);
    return;
  }
  if (!conflictWarnings) return;
  console.warn(
    `[useShortcut] Conflict detected (${conflict.reason}) between "${conflict.combo}" and "${conflict.existingCombo}"`
  );
}
function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.id - b.id;
  });
}
function createBinding(state, handler, handlerOptions = {}, registry) {
  const { options, except: stateExcept } = state;
  const rawSteps = state.steps;
  if (rawSteps.length === 0) {
    throw new Error("[useShortcut] No key specified. Use .key() to set the action key.");
  }
  const parsedSteps = rawSteps.map((step) => parseShortcut(step));
  const combo = parsedSteps.map(canonicalizeParsed).join(" ");
  const display = formatSequenceDisplay(rawSteps);
  const debug = options.debug ?? false;
  const except = stateExcept ?? handlerOptions.except;
  for (const [existingCombo, listener] of registry.listeners.entries()) {
    for (const existing of listener.entries) {
      if (existingCombo === combo) continue;
      const reason = detectConflict(parsedSteps, existing.parsedSteps);
      if (!reason) continue;
      emitConflict(registry, { combo, existingCombo, reason });
    }
  }
  const isEnabled = !handlerOptions.disabled && !options.disabled;
  const delay = handlerOptions.delay ?? options.delay ?? 0;
  const sequenceTimeout = handlerOptions.sequenceTimeout ?? options.sequenceTimeout ?? 800;
  const requiredScopes = new Set(normalizeScopes(state.scopes ?? handlerOptions.scopes));
  const attemptCallbacks = /* @__PURE__ */ new Set();
  debugLog(debug, "Registering:", combo, "\u2192", display, {
    parsedSteps,
    except: !!except,
    scopes: [...requiredScopes]
  });
  const entry = {
    id: registry.nextId++,
    userHandler: handler,
    isEnabled,
    attemptCallbacks,
    parsedSteps,
    scopes: requiredScopes,
    progress: 0,
    lastMatchedAt: 0,
    except,
    delay,
    sequenceTimeout,
    preventDefault: handlerOptions.preventDefault !== false,
    stopPropagation: handlerOptions.stopPropagation ?? false,
    stopOnMatch: handlerOptions.stopOnMatch ?? false,
    priority: handlerOptions.priority ?? 0
  };
  let comboListener = registry.listeners.get(combo);
  if (!comboListener) {
    const target = options.target ?? (typeof window !== "undefined" ? window : null);
    const eventType = options.eventType ?? "keydown";
    const listener = (event) => {
      const runtimeOptions = registry.options;
      if (runtimeOptions.disabled) return;
      if (runtimeOptions.eventFilter && !runtimeOptions.eventFilter(event)) return;
      const current = registry.listeners.get(combo);
      if (!current) return;
      const orderedEntries = sortEntries(current.entries);
      for (const item of orderedEntries) {
        if (!item.isEnabled) continue;
        if (!scopeMatch(item.scopes, registry.activeScopes)) {
          continue;
        }
        if (runtimeOptions.ignoreInputs !== false && !item.except) {
          const targetEl = event.target;
          if (targetEl && (IGNORED_TAGS.has(targetEl.tagName) || targetEl.isContentEditable)) {
            continue;
          }
        }
        if (shouldExcept(event, item.except)) {
          debugLog(debug, "Skipped due to except condition:", combo);
          continue;
        }
        const expected = item.parsedSteps[item.progress];
        const now = Date.now();
        if (item.progress > 0 && now - item.lastMatchedAt > item.sequenceTimeout) {
          item.progress = 0;
        }
        let matched = false;
        if (matchesShortcut(event, expected)) {
          item.progress += 1;
          item.lastMatchedAt = now;
          if (item.progress === item.parsedSteps.length) {
            matched = true;
            item.progress = 0;
          }
        } else if (item.progress > 0 && matchesShortcut(event, item.parsedSteps[0])) {
          item.progress = 1;
          item.lastMatchedAt = now;
        } else {
          item.progress = 0;
        }
        item.attemptCallbacks.forEach((cb) => cb(matched, event));
        if (!matched) continue;
        debugLog(debug, "MATCHED:", combo, "\u2192", display);
        if (item.preventDefault) {
          event.preventDefault();
        }
        if (item.stopPropagation) {
          event.stopPropagation();
        }
        const executeHandler = () => item.userHandler(event);
        if (item.delay > 0) {
          debugLog(debug, "Delaying execution by", item.delay, "ms");
          setTimeout(executeHandler, item.delay);
        } else {
          executeHandler();
        }
        if (item.stopOnMatch) {
          break;
        }
      }
    };
    if (target) {
      target.addEventListener(eventType, listener);
      debugLog(debug, "Listener attached for:", combo);
    }
    const unbind = () => {
      if (target) {
        target.removeEventListener(eventType, listener);
        registry.listeners.delete(combo);
        debugLog(debug, "Unregistered:", combo);
      }
    };
    comboListener = {
      listener,
      entries: [],
      unbind
    };
    registry.listeners.set(combo, comboListener);
  }
  comboListener.entries.push(entry);
  const unbindEntry = () => {
    const current = registry.listeners.get(combo);
    if (!current) return;
    current.entries = current.entries.filter((item) => item.id !== entry.id);
    if (current.entries.length === 0) {
      current.unbind();
    }
  };
  return {
    unbind: unbindEntry,
    display,
    combo,
    trigger: () => handler(new KeyboardEvent(registry.options.eventType ?? "keydown")),
    get isEnabled() {
      return entry.isEnabled;
    },
    enable: () => {
      entry.isEnabled = true;
    },
    disable: () => {
      entry.isEnabled = false;
    },
    onAttempt: (callback) => {
      entry.attemptCallbacks.add(callback);
      return () => entry.attemptCallbacks.delete(callback);
    }
  };
}
function createRecorder(options) {
  return (recordingOptions = {}) => {
    return new Promise((resolve, reject) => {
      const target = recordingOptions.target ?? options.target ?? (typeof window !== "undefined" ? window : null);
      const eventType = recordingOptions.eventType ?? options.eventType ?? "keydown";
      if (!target) {
        reject(new Error("[useShortcut] Cannot record shortcut without a target."));
        return;
      }
      let timeout;
      const listener = (event) => {
        const keyboardEvent = event;
        if (isPureModifier(keyboardEvent)) return;
        keyboardEvent.preventDefault();
        target.removeEventListener(eventType, listener);
        if (timeout) clearTimeout(timeout);
        resolve(eventToCombo(keyboardEvent));
      };
      target.addEventListener(eventType, listener, { once: false });
      const timeoutMs = recordingOptions.timeoutMs;
      if (timeoutMs && timeoutMs > 0) {
        timeout = setTimeout(() => {
          target.removeEventListener(eventType, listener);
          reject(new Error(`[useShortcut] Recording timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      }
    });
  };
}
function createShortcutBuilder(options = {}) {
  const registry = {
    listeners: /* @__PURE__ */ new Map(),
    options,
    activeScopes: new Set(normalizeScopes(options.activeScopes)),
    nextId: 1
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
        if (prop === "in") {
          return (scopes) => {
            const nextScopes = [...normalizeScopes(currentState.scopes), ...normalizeScopes(scopes)];
            const newState = {
              ...currentState,
              scopes: nextScopes
            };
            return createProxy(newState);
          };
        }
        if (prop === "setScopes") {
          return (scopes) => {
            registry.activeScopes = new Set(normalizeScopes(scopes));
          };
        }
        if (prop === "enableScope") {
          return (scope) => {
            if (!scope?.trim()) return;
            registry.activeScopes.add(scope.trim());
          };
        }
        if (prop === "disableScope") {
          return (scope) => {
            if (!scope?.trim()) return;
            registry.activeScopes.delete(scope.trim());
          };
        }
        if (prop === "getScopes") {
          return () => [...registry.activeScopes];
        }
        if (prop === "isScopeActive") {
          return (scope) => registry.activeScopes.has(scope);
        }
        if (prop === "record") {
          return createRecorder(registry.options);
        }
        if (prop === "key") {
          return (key) => {
            const nextStep = buildComboString(currentState.modifiers, key);
            const newState = {
              ...currentState,
              modifiers: {},
              steps: [...currentState.steps, nextStep]
            };
            debugLog(currentState.options.debug, `Chain: .key("${key}")`);
            return createProxy(newState);
          };
        }
        if (prop === "then") {
          return (key) => {
            const nextStep = String(key).trim().toLowerCase();
            if (!nextStep) {
              throw new Error("[useShortcut] .then() requires a non-empty key or shortcut step.");
            }
            const newState = {
              ...currentState,
              steps: [...currentState.steps, nextStep]
            };
            debugLog(currentState.options.debug, `Chain: .then("${nextStep}")`);
            return createProxy(newState);
          };
        }
        if (prop === "except") {
          return (condition) => {
            const newState = {
              ...currentState,
              except: condition
            };
            debugLog(currentState.options.debug, "Chain: .except()", condition);
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
    steps: [],
    options
  };
  return {
    builder: createProxy(initialState),
    registry
  };
}

// src/hook.ts
function normalizeShortcutMapKeys(keys) {
  if (Array.isArray(keys)) {
    return keys.map((key) => key.trim()).filter(Boolean);
  }
  const trimmed = keys.trim();
  if (!trimmed) return [];
  if (trimmed.includes(" then ")) {
    return trimmed.split(/\s+then\s+/i).map((key) => key.trim()).filter(Boolean);
  }
  if (trimmed.includes(" ") && !trimmed.includes("+")) {
    return trimmed.split(/\s+/).map((key) => key.trim()).filter(Boolean);
  }
  return [trimmed];
}
function applyStep(builder, step) {
  const tokens = step.toLowerCase().split("+").map((token) => token.trim()).filter(Boolean);
  if (tokens.length === 0) {
    throw new Error("[useShortcutMap] Invalid step: empty shortcut step");
  }
  const key = tokens.pop();
  let chain = builder;
  for (const token of tokens) {
    if (token === "ctrl" || token === "control") {
      chain = chain.ctrl;
      continue;
    }
    if (token === "shift") {
      chain = chain.shift;
      continue;
    }
    if (token === "alt" || token === "option") {
      chain = chain.alt;
      continue;
    }
    if (token === "cmd" || token === "command" || token === "meta") {
      chain = chain.cmd;
      continue;
    }
    if (token === "mod") {
      chain = chain.mod;
      continue;
    }
    throw new Error(`[useShortcutMap] Unsupported modifier token "${token}" in step "${step}"`);
  }
  return chain.key(key);
}
function registerShortcutMap(builder, shortcutMap) {
  const results = {};
  for (const id of Object.keys(shortcutMap)) {
    const entry = shortcutMap[id];
    const steps = normalizeShortcutMapKeys(entry.keys);
    if (steps.length === 0) {
      throw new Error(`[useShortcutMap] Shortcut "${String(id)}" has no key steps`);
    }
    let chain = applyStep(builder, steps[0]);
    for (const step of steps.slice(1)) {
      chain = chain.then(step);
    }
    results[id] = chain.on(entry.handler, entry.options);
  }
  return results;
}
function useShortcut(options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const { builder, registry } = useMemo(() => {
    return createShortcutBuilder(optionsRef.current);
  }, []);
  useEffect(() => {
    registry.options = optionsRef.current;
    if (optionsRef.current.activeScopes !== void 0) {
      const scopes = Array.isArray(optionsRef.current.activeScopes) ? optionsRef.current.activeScopes : [optionsRef.current.activeScopes];
      registry.activeScopes = new Set(scopes.map((scope) => scope.trim()).filter(Boolean));
    }
  }, [registry, options]);
  useEffect(() => {
    return () => {
      registry.listeners.forEach((entry) => entry.unbind());
      registry.listeners.clear();
    };
  }, [registry]);
  return builder;
}
function useShortcutMap(shortcutMap, options = {}) {
  const $ = useShortcut(options);
  const [results, setResults] = useState({});
  useEffect(() => {
    const registrations = registerShortcutMap($, shortcutMap);
    setResults(registrations);
    return () => {
      for (const result of Object.values(registrations)) {
        result.unbind();
      }
    };
  }, [$, shortcutMap]);
  return results;
}
function createShortcut(options = {}) {
  const { builder } = createShortcutBuilder(options);
  return builder;
}
function createShortcutMap(shortcutMap, options = {}) {
  const builder = createShortcut(options);
  return registerShortcutMap(builder, shortcutMap);
}
function createShortcutGroup() {
  const results = [];
  return {
    add: (...entries) => {
      results.push(...entries);
    },
    addMany: (entries) => {
      if (Array.isArray(entries)) {
        results.push(...entries);
        return;
      }
      results.push(...Object.values(entries));
    },
    unbindAll: () => {
      for (const entry of results) {
        entry.unbind();
      }
      results.length = 0;
    },
    clear: () => {
      results.length = 0;
    },
    getResults: () => [...results]
  };
}
function useShortcutGroup() {
  const groupRef = useRef(null);
  if (!groupRef.current) {
    groupRef.current = createShortcutGroup();
  }
  return groupRef.current;
}

export { ModifierAliases, ModifierDisplayOrder, ModifierDisplaySymbols, ModifierKey, Platform, SpecialKeyMap, createShortcut, createShortcutGroup, createShortcutMap, detectPlatform, formatShortcut, getModifierSymbols, getModifiersFromEvent, matchesAnyShortcut, matchesShortcut, parseShortcut, parseShortcuts, registerShortcutMap, useShortcut, useShortcutGroup, useShortcutMap };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map