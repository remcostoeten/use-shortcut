"use client"

import { useShortcut } from "@/lib/keyboard"
import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ShortcutLog {
  id: number
  combo: string
  display: string
  time: string
  status: "success" | "missed" | "late"
}

interface KeyState {
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
  key: string | null
}

export function ShortcutDemo() {
  const [logs, setLogs] = useState<ShortcutLog[]>([])
  const [counter, setCounter] = useState(0)
  const [editorContent, setEditorContent] = useState("")
  const [pressedKeys, setPressedKeys] = useState<KeyState>({
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: null,
  })
  const [highlightedCombo, setHighlightedCombo] = useState<string | null>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  // Track pressed keys for visual feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKeys({
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
        key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
      })
    }

    const handleKeyUp = () => {
      setPressedKeys({
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
        key: null,
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const addLog = useCallback((combo: string, display: string, status: ShortcutLog["status"] = "success") => {
    setHighlightedCombo(combo)
    setTimeout(() => setHighlightedCombo(null), 300)

    setLogs((prev) => [
      {
        id: Date.now(),
        combo,
        display,
        time: new Date().toLocaleTimeString(),
        status,
      },
      ...prev.slice(0, 9),
    ])
  }, [])

  const focusEditor = useCallback(() => {
    editorRef.current?.focus()
    addLog("slash", "Focus Editor", "success")
  }, [addLog])

  const $ = useShortcut({ debug: true })

  // Single modifier + key
  const save = $.cmd.key("s").on(() => addLog("cmd+s", "Save"), { description: "Save document" })

  // Multiple modifiers
  const commandPalette = $.cmd.shift.key("p").on(() => addLog("cmd+shift+p", "Command Palette"), {
    description: "Open command palette",
  })

  // All modifiers
  const superCombo = $.ctrl.shift.alt.cmd.key("a").on(() => addLog("ctrl+shift+alt+cmd+a", "Super Combo!"), {
    description: "Super combo!",
  })

  // Cross-platform
  const crossPlatform = $.mod.key("k").on(() => addLog("mod+k", "Search"), {
    description: "Cross-platform shortcut",
  })

  // With delay
  const delayed = $.mod.shift.key("d").on(
    () => {
      setCounter((c) => c + 1)
      addLog("mod+shift+d", "Delayed +1", "success")
    },
    { delay: 500, description: "Delayed by 500ms" },
  )

  // Function key
  const help = $.key("f1").on(() => addLog("f1", "Help opened"), { description: "Show help" })

  // Escape key
  const escape = $.key("escape").on(() => addLog("escape", "Cancelled"), { description: "Escape/Cancel" })

  // NEW: Using .except() - "/" focuses editor EXCEPT when typing
  const slashFocus = $.key("slash")
    .except("typing")
    .on(focusEditor, { description: "Focus editor (except when typing)" })

  const shortcuts = [
    { result: save, name: "Save", keys: ["cmd", "s"] },
    { result: commandPalette, name: "Command Palette", keys: ["cmd", "shift", "p"] },
    { result: superCombo, name: "Super Combo", keys: ["ctrl", "shift", "alt", "cmd", "a"] },
    { result: crossPlatform, name: "Search", keys: ["mod", "k"] },
    { result: delayed, name: `Delayed (${counter})`, keys: ["mod", "shift", "d"] },
    { result: help, name: "Help", keys: ["f1"] },
    { result: escape, name: "Cancel", keys: ["escape"] },
    { result: slashFocus, name: "Focus Editor", keys: ["/"], hasExcept: true },
  ]

  const isKeyPressed = (key: string) => {
    const k = key.toLowerCase()
    if (k === "cmd" || k === "meta" || k === "mod") return pressedKeys.meta
    if (k === "ctrl" || k === "control") return pressedKeys.ctrl
    if (k === "shift") return pressedKeys.shift
    if (k === "alt" || k === "option") return pressedKeys.alt
    return pressedKeys.key === k || pressedKeys.key === key
  }

  return (
    <div className="space-y-6">
      {/* Live Key Visualizer */}
      <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-400">Live Key State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Ctrl", "Shift", "Alt", "Cmd"].map((mod) => (
              <kbd
                key={mod}
                className={`inline-flex h-8 min-w-[3rem] items-center justify-center rounded border px-2 font-mono text-xs transition-all duration-100 ${
                  isKeyPressed(mod)
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-500"
                }`}
              >
                {mod}
              </kbd>
            ))}
            <span className="mx-2 flex items-center text-zinc-600">+</span>
            <kbd
              className={`inline-flex h-8 min-w-[3rem] items-center justify-center rounded border px-3 font-mono text-xs transition-all duration-100 ${
                pressedKeys.key && !["Control", "Shift", "Alt", "Meta"].includes(pressedKeys.key)
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "border-zinc-700 bg-zinc-800/50 text-zinc-500"
              }`}
            >
              {pressedKeys.key && !["Control", "Shift", "Alt", "Meta"].includes(pressedKeys.key)
                ? pressedKeys.key.toUpperCase()
                : "Key"}
            </kbd>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Registered Shortcuts */}
        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-zinc-100">Registered Shortcuts</CardTitle>
            <CardDescription className="text-zinc-500">Press a combo - cards highlight when matched</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shortcuts.map(({ result, name, keys, hasExcept }) => {
                const isHighlighted = highlightedCombo === result.combo
                const allKeysPressed = keys.every((k) => isKeyPressed(k))

                return (
                  <div
                    key={result.combo}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-all duration-150 ${
                      isHighlighted
                        ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : allKeysPressed
                          ? "border-amber-500/50 bg-amber-500/5"
                          : "border-zinc-800 bg-zinc-950/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-300">{name}</span>
                      {hasExcept && (
                        <Badge variant="outline" className="border-amber-500/30 text-[10px] text-amber-500">
                          .except("typing")
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-zinc-600 text-xs">+</span>}
                          <kbd
                            className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border px-1.5 font-mono text-[10px] transition-all ${
                              isKeyPressed(key)
                                ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                                : "border-zinc-700 bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {key === "cmd"
                              ? "⌘"
                              : key === "mod"
                                ? "⌘"
                                : key === "shift"
                                  ? "⇧"
                                  : key === "alt"
                                    ? "⌥"
                                    : key === "ctrl"
                                      ? "⌃"
                                      : key.toUpperCase()}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Event Log */}
        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-zinc-100">Event Log</CardTitle>
            <CardDescription className="text-zinc-500">Recent activations with status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-zinc-600">Press a shortcut to see it logged...</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between rounded border p-2 ${
                      log.status === "success"
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : log.status === "late"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          log.status === "success"
                            ? "bg-emerald-500"
                            : log.status === "late"
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                      />
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs ${
                          log.status === "success"
                            ? "border-emerald-500/30 text-emerald-400"
                            : log.status === "late"
                              ? "border-amber-500/30 text-amber-400"
                              : "border-red-500/30 text-red-400"
                        }`}
                      >
                        {log.display}
                      </Badge>
                    </div>
                    <span className="text-xs text-zinc-600">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editor Demo - shows .except("typing") in action */}
      <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-zinc-100">Editor Demo</CardTitle>
          <CardDescription className="text-zinc-500">
            Press{" "}
            <kbd className="mx-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-emerald-400">
              /
            </kbd>
            outside to focus • typing "/" inside won't trigger the shortcut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            ref={editorRef}
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            placeholder="Type here... pressing '/' will type normally because of .except('typing')"
            className="h-32 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </CardContent>
      </Card>
    </div>
  )
}
