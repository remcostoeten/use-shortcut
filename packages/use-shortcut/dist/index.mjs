import { useRef, useMemo, useEffect } from 'react';

// src/constants.ts
var OS = {
  MAC: "mac",
  WINDOWS: "windows",
  LINUX: "linux"
};
var Platform = OS;
var _cachedPlatform = null;
function detectPlatform() {
  if (_cachedPlatform) return _cachedPlatform;
  if (typeof navigator === "undefined") {
    _cachedPlatform = OS.WINDOWS;
    return _cachedPlatform;
  }
  const uaPlatform = navigator.userAgentData?.platform?.toLowerCase();
  const platform = (uaPlatform ?? navigator.platform ?? navigator.userAgent ?? "").toLowerCase();
  if (platform.includes("mac") || platform.includes("iphone") || platform.includes("ipad") || platform.includes("ipod")) {
    _cachedPlatform = OS.MAC;
    return _cachedPlatform;
  }
  if (platform.includes("linux") || platform.includes("android")) {
    _cachedPlatform = OS.LINUX;
    return _cachedPlatform;
  }
  if (platform.includes("win")) {
    _cachedPlatform = OS.WINDOWS;
    return _cachedPlatform;
  }
  _cachedPlatform = OS.WINDOWS;
  return _cachedPlatform;
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
  [OS.MAC]: {
    [ModifierKey.META]: "\u2318",
    [ModifierKey.CTRL]: "\u2303",
    [ModifierKey.ALT]: "\u2325",
    [ModifierKey.SHIFT]: "\u21E7"
  },
  [OS.WINDOWS]: {
    [ModifierKey.META]: "Ctrl",
    [ModifierKey.CTRL]: "Ctrl",
    [ModifierKey.ALT]: "Alt",
    [ModifierKey.SHIFT]: "Shift"
  },
  [OS.LINUX]: {
    [ModifierKey.META]: "Super",
    [ModifierKey.CTRL]: "Ctrl",
    [ModifierKey.ALT]: "Alt",
    [ModifierKey.SHIFT]: "Shift"
  }
};
var ModifierDisplayOrder = {
  [OS.MAC]: [ModifierKey.CTRL, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.META],
  [OS.WINDOWS]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL],
  [OS.LINUX]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL]
};

// src/parser.ts
function _normalizeKeyToken(key) {
  return key === " " ? "space" : key.toLowerCase();
}
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
  const eventKey = _normalizeKeyToken(event.key);
  const modifiersMatch = eventModifiers.meta === parsed.modifiers.meta && eventModifiers.ctrl === parsed.modifiers.ctrl && eventModifiers.alt === parsed.modifiers.alt && eventModifiers.shift === parsed.modifiers.shift;
  const keyMatches = eventKey === _normalizeKeyToken(parsed.key);
  return modifiersMatch && keyMatches;
}
function matchesAnyShortcut(event, parsedShortcuts) {
  return parsedShortcuts.some((parsed) => matchesShortcut(event, parsed));
}

// src/formatter.ts
var _BASE_DISPLAY_NAMES = {
  ArrowUp: "\u2191",
  ArrowDown: "\u2193",
  ArrowLeft: "\u2190",
  ArrowRight: "\u2192",
  Home: "Home",
  End: "End",
  PageUp: "PgUp",
  PageDown: "PgDn"
};
var _MAC_DISPLAY_NAMES = {
  ..._BASE_DISPLAY_NAMES,
  Enter: "\u21A9",
  Tab: "\u21E5",
  Escape: "\u238B",
  Backspace: "\u232B",
  Delete: "\u2326",
  " ": "\u2423"
};
var _NON_MAC_DISPLAY_NAMES = {
  ..._BASE_DISPLAY_NAMES,
  Enter: "Enter",
  Tab: "Tab",
  Escape: "Esc",
  Backspace: "Backspace",
  Delete: "Del",
  " ": "Space"
};
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
  const displayKey = _formatKey(parsed.key, targetPlatform);
  parts.push(displayKey);
  const separator = targetPlatform === OS.MAC ? "" : "+";
  return parts.join(separator);
}
function _formatKey(key, platform) {
  const displayNames = platform === OS.MAC ? _MAC_DISPLAY_NAMES : _NON_MAC_DISPLAY_NAMES;
  return displayNames[key] || key.toUpperCase();
}

// src/runtime/debug.ts
function _debugLog(debug, ...args) {
  if (debug) {
    console.log("[useShortcut]", ...args);
  }
}

// src/runtime/keys.ts
function _getActiveModifierTokens(modifiers) {
  const platform = detectPlatform();
  const order = ModifierDisplayOrder[platform];
  const tokens = [];
  for (const key of order) {
    if (key === ModifierKey.CTRL && modifiers.ctrl) tokens.push("ctrl");
    if (key === ModifierKey.ALT && modifiers.alt) tokens.push("alt");
    if (key === ModifierKey.SHIFT && modifiers.shift) tokens.push("shift");
    if (key === ModifierKey.META && modifiers.cmd) tokens.push("cmd");
  }
  return tokens;
}
function _buildComboString(modifiers, key) {
  const tokens = _getActiveModifierTokens(modifiers);
  return [...tokens, key].join("+");
}
function _formatSequenceDisplay(steps) {
  return steps.map((step) => formatShortcut(step)).join(" then ");
}
function _canonicalizeParsed(parsed) {
  const modifiers = [];
  if (parsed.modifiers.ctrl) modifiers.push("ctrl");
  if (parsed.modifiers.alt) modifiers.push("alt");
  if (parsed.modifiers.shift) modifiers.push("shift");
  if (parsed.modifiers.meta) modifiers.push("cmd");
  const key = parsed.key === " " || parsed.key === "Spacebar" ? "space" : parsed.key.toLowerCase();
  return [...modifiers, key].join("+");
}
function _eventToCombo(event) {
  const modifiers = [];
  if (event.ctrlKey) modifiers.push("ctrl");
  if (event.altKey) modifiers.push("alt");
  if (event.shiftKey) modifiers.push("shift");
  if (event.metaKey) modifiers.push("cmd");
  const key = event.key === " " || event.key === "Spacebar" ? "space" : event.key.toLowerCase();
  return [...modifiers, key].join("+");
}
function _eventToMatchStep(event) {
  return _eventToCombo(event);
}

// src/runtime/conflicts.ts
function _isPrefix(a, b) {
  if (a.length > b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
function _detectConflict(newSteps, existingSteps) {
  const newCanonicalSteps = newSteps.map(_canonicalizeParsed);
  const existingCanonicalSteps = existingSteps.map(_canonicalizeParsed);
  const newCombo = newCanonicalSteps.join(" ");
  const existingCombo = existingCanonicalSteps.join(" ");
  if (newCombo === existingCombo) return "exact";
  if (_isPrefix(newCanonicalSteps, existingCanonicalSteps) || _isPrefix(existingCanonicalSteps, newCanonicalSteps)) {
    return "sequence-prefix";
  }
  return null;
}
function _emitConflict(registry, conflict) {
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

// src/runtime/guards.ts
var _IGNORED_TAGS = /* @__PURE__ */ new Set(["INPUT", "TEXTAREA", "SELECT"]);
var _EXCEPT_PREDICATES = {
  input: (e) => {
    if (!(e.target instanceof HTMLElement)) return false;
    const target = e.target;
    return _IGNORED_TAGS.has(target.tagName);
  },
  editable: (e) => {
    if (!(e.target instanceof HTMLElement)) return false;
    const target = e.target;
    return target.isContentEditable;
  },
  typing: (e) => {
    if (!(e.target instanceof HTMLElement)) return false;
    const target = e.target;
    return _IGNORED_TAGS.has(target.tagName) || target.isContentEditable;
  },
  modal: () => {
    if (typeof document === "undefined" || typeof document.querySelector !== "function")
      return false;
    return document.querySelector('[data-modal="true"], [role="dialog"]') !== null;
  },
  disabled: (e) => {
    if (!(e.target instanceof HTMLElement)) return false;
    const target = e.target;
    return target.hasAttribute("disabled") || target.getAttribute("aria-disabled") === "true";
  }
};
function _shouldExcept(event, except) {
  if (!except) return false;
  if (typeof except === "function") {
    return except(event);
  }
  if (Array.isArray(except)) {
    return except.some((preset) => _EXCEPT_PREDICATES[preset]?.(event));
  }
  return _EXCEPT_PREDICATES[except]?.(event) ?? false;
}
function _normalizeScopes(scopes) {
  if (!scopes) return [];
  return (Array.isArray(scopes) ? scopes : [scopes]).map((scope) => scope.trim()).filter(Boolean);
}
function _scopeMatch(requiredScopes, activeScopes) {
  if (requiredScopes.size === 0) return true;
  for (const required of requiredScopes) {
    if (activeScopes.has(required)) return true;
  }
  return false;
}
function _isPureModifier(event) {
  const key = event.key.toLowerCase();
  return key === "shift" || key === "control" || key === "alt" || key === "meta";
}

// src/runtime/listener.ts
function _sortEntries(entries) {
  if (entries.length <= 1) return entries;
  return [...entries].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.id - b.id;
  });
}
function _dispatchRegistryEvent(registry, event) {
  const runtimeOptions = registry.options;
  if (runtimeOptions.disabled) return;
  if (runtimeOptions.eventFilter && !runtimeOptions.eventFilter(event)) return;
  const candidateCombos = /* @__PURE__ */ new Set();
  const firstStepCombos = registry.firstStepIndex.get(_eventToMatchStep(event));
  if (firstStepCombos) {
    for (const combo of firstStepCombos) candidateCombos.add(combo);
  }
  for (const combo of registry.activeSequenceCombos) {
    candidateCombos.add(combo);
  }
  for (const combo of candidateCombos) {
    const comboEntries = registry.listeners.get(combo);
    if (!comboEntries) continue;
    const orderedEntries = _sortEntries(comboEntries);
    for (const item of orderedEntries) {
      if (!item.isEnabled) continue;
      if (!_scopeMatch(item.scopes, registry.activeScopes)) {
        continue;
      }
      if (runtimeOptions.ignoreInputs !== false && !item.except) {
        const targetEl = event.target;
        if (targetEl && (_IGNORED_TAGS.has(targetEl.tagName) || targetEl.isContentEditable)) {
          continue;
        }
      }
      if (_shouldExcept(event, item.except)) {
        _debugLog(runtimeOptions.debug, "Skipped due to except condition:", combo);
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
      for (const cb of item.attemptCallbacks) {
        cb(matched, event);
      }
      if (!matched) continue;
      _debugLog(runtimeOptions.debug, "MATCHED:", combo);
      if (item.preventDefault) {
        event.preventDefault();
      }
      if (item.stopPropagation) {
        event.stopPropagation();
      }
      const executeHandler = () => item.userHandler(event);
      if (item.delay > 0) {
        _debugLog(runtimeOptions.debug, "Delaying execution by", item.delay, "ms");
        setTimeout(executeHandler, item.delay);
      } else {
        executeHandler();
      }
      if (item.stopOnMatch) {
        break;
      }
    }
    if (comboEntries.some((entry) => entry.progress > 0)) {
      registry.activeSequenceCombos.add(combo);
    } else {
      registry.activeSequenceCombos.delete(combo);
    }
  }
}
function _attachRegistryListener(registry) {
  if (registry.listener) return;
  const target = registry.options.target ?? (typeof window !== "undefined" ? window : null);
  if (!target) return;
  const eventType = registry.options.eventType ?? "keydown";
  const listener = (event) => _dispatchRegistryEvent(registry, event);
  target.addEventListener(eventType, listener);
  registry.listener = listener;
  registry.listenerTarget = target;
  registry.listenerEventType = eventType;
  _debugLog(registry.options.debug, "Listener attached");
}
function _detachRegistryListener(registry) {
  if (!registry.listener || !registry.listenerTarget) return;
  registry.listenerTarget.removeEventListener(registry.listenerEventType, registry.listener);
  registry.listener = null;
  registry.listenerTarget = null;
  _debugLog(registry.options.debug, "Listener detached");
}

// src/runtime/binding.ts
function _createBinding(state, handler, handlerOptions = {}, registry) {
  const { options, except: stateExcept } = state;
  const rawSteps = state.steps;
  if (rawSteps.length === 0) {
    throw new Error("[useShortcut] No key specified. Use .key() to set the action key.");
  }
  const parsedSteps = rawSteps.map((step) => parseShortcut(step));
  const combo = parsedSteps.map(_canonicalizeParsed).join(" ");
  const display = _formatSequenceDisplay(rawSteps);
  const debug = options.debug ?? false;
  const except = stateExcept ?? handlerOptions.except;
  for (const [existingCombo, entries] of registry.listeners.entries()) {
    for (const existing of entries) {
      if (existingCombo === combo) continue;
      const reason = _detectConflict(parsedSteps, existing.parsedSteps);
      if (!reason) continue;
      _emitConflict(registry, { combo, existingCombo, reason });
    }
  }
  const isEnabled = !handlerOptions.disabled && !options.disabled;
  const delay = handlerOptions.delay ?? options.delay ?? 0;
  const sequenceTimeout = handlerOptions.sequenceTimeout ?? options.sequenceTimeout ?? 800;
  const requiredScopes = new Set(_normalizeScopes(state.scopes ?? handlerOptions.scopes));
  const attemptCallbacks = /* @__PURE__ */ new Set();
  _debugLog(debug, "Registering:", combo, "\u2192", display, {
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
  const comboEntries = registry.listeners.get(combo);
  if (comboEntries) {
    comboEntries.push(entry);
  } else {
    registry.listeners.set(combo, [entry]);
    const firstStep = _canonicalizeParsed(parsedSteps[0]);
    const indexedCombos = registry.firstStepIndex.get(firstStep);
    if (indexedCombos) {
      indexedCombos.add(combo);
    } else {
      registry.firstStepIndex.set(firstStep, /* @__PURE__ */ new Set([combo]));
    }
  }
  _attachRegistryListener(registry);
  const unbindEntry = () => {
    const currentEntries = registry.listeners.get(combo);
    if (!currentEntries) return;
    const nextEntries = currentEntries.filter((item) => item.id !== entry.id);
    if (nextEntries.length === 0) {
      registry.listeners.delete(combo);
      registry.activeSequenceCombos.delete(combo);
      const firstStep = _canonicalizeParsed(parsedSteps[0]);
      const indexedCombos = registry.firstStepIndex.get(firstStep);
      if (indexedCombos) {
        indexedCombos.delete(combo);
        if (indexedCombos.size === 0) {
          registry.firstStepIndex.delete(firstStep);
        }
      }
      _debugLog(debug, "Unregistered:", combo);
    } else {
      registry.listeners.set(combo, nextEntries);
    }
    if (registry.listeners.size === 0) {
      _detachRegistryListener(registry);
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

// src/runtime/recording.ts
function _createRecorder(options) {
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
        if (_isPureModifier(keyboardEvent)) return;
        keyboardEvent.preventDefault();
        target.removeEventListener(eventType, listener);
        if (timeout) clearTimeout(timeout);
        resolve(_eventToCombo(keyboardEvent));
      };
      target.addEventListener(eventType, listener);
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

// src/builder.ts
var _MODIFIER_KEYS = /* @__PURE__ */ new Set(["ctrl", "shift", "alt", "cmd", "mod"]);
function _createShortcutBuilder(options = {}) {
  const registry = {
    listeners: /* @__PURE__ */ new Map(),
    firstStepIndex: /* @__PURE__ */ new Map(),
    activeSequenceCombos: /* @__PURE__ */ new Set(),
    options,
    activeScopes: new Set(_normalizeScopes(options.activeScopes)),
    nextId: 1,
    listener: null,
    listenerTarget: null,
    listenerEventType: options.eventType ?? "keydown"
  };
  _debugLog(options.debug, "Builder created with options:", options);
  function _createProxy(currentState) {
    return new Proxy({}, {
      get(_, prop) {
        if (prop === "__debug") {
          return currentState.options.debug;
        }
        if (_MODIFIER_KEYS.has(prop)) {
          const platform = detectPlatform();
          const modKey = prop === "mod" ? platform === Platform.MAC ? "cmd" : "ctrl" : prop;
          const newState = {
            ...currentState,
            modifiers: { ...currentState.modifiers, [modKey]: true }
          };
          _debugLog(currentState.options.debug, `Chain: +${prop} \u2192`, newState.modifiers);
          return _createProxy(newState);
        }
        if (prop === "in") {
          return (scopes) => {
            const nextScopes = [..._normalizeScopes(currentState.scopes), ..._normalizeScopes(scopes)];
            const newState = {
              ...currentState,
              scopes: nextScopes
            };
            return _createProxy(newState);
          };
        }
        if (prop === "setScopes") {
          return (scopes) => {
            registry.activeScopes = new Set(_normalizeScopes(scopes));
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
          return _createRecorder(registry.options);
        }
        if (prop === "key") {
          return (key) => {
            const nextStep = _buildComboString(currentState.modifiers, key);
            const newState = {
              ...currentState,
              modifiers: {},
              steps: [...currentState.steps, nextStep]
            };
            _debugLog(currentState.options.debug, `Chain: .key("${key}")`);
            return _createProxy(newState);
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
            _debugLog(currentState.options.debug, `Chain: .then("${nextStep}")`);
            return _createProxy(newState);
          };
        }
        if (prop === "except") {
          return (condition) => {
            const newState = {
              ...currentState,
              except: condition
            };
            _debugLog(currentState.options.debug, "Chain: .except()", condition);
            return _createProxy(newState);
          };
        }
        if (prop === "on") {
          return (handler, handlerOptions) => {
            return _createBinding(currentState, handler, handlerOptions, registry);
          };
        }
        if (prop === "handle") {
          return (opts) => {
            const { handler, ...rest } = opts;
            return _createBinding(currentState, handler, rest, registry);
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
    builder: _createProxy(initialState),
    registry
  };
}

// src/hook.ts
function useShortcut(options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const { builder, registry } = useMemo(() => {
    return _createShortcutBuilder(optionsRef.current);
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
      registry.listeners.clear();
      registry.firstStepIndex.clear();
      registry.activeSequenceCombos.clear();
      if (registry.listener && registry.listenerTarget) {
        registry.listenerTarget.removeEventListener(registry.listenerEventType, registry.listener);
        registry.listener = null;
        registry.listenerTarget = null;
      }
    };
  }, [registry]);
  return builder;
}

export { ModifierAliases, ModifierDisplayOrder, ModifierDisplaySymbols, ModifierKey, Platform, SpecialKeyMap, detectPlatform, formatShortcut, matchesAnyShortcut, matchesShortcut, parseShortcut, parseShortcuts, useShortcut };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map