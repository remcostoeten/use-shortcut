"use client"

import { useShortcut } from "@/core/keyboard"
import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface KeyCapProps {
  label: string
  isPressed: boolean
  variant?: "small" | "large"
}

function KeyCap({ label, isPressed, variant = "large" }: KeyCapProps) {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")

  const displayLabel =
    label.toLowerCase() === "cmd" || label.toLowerCase() === "mod"
      ? isMac
        ? "⌘"
        : "Ctrl"
      : label.toLowerCase() === "shift"
        ? "⇧"
        : label.toLowerCase() === "alt" || label.toLowerCase() === "option"
          ? "⌥"
          : label.toLowerCase() === "ctrl"
            ? "⌃"
            : label.toUpperCase()

  const baseStyles = "inline-flex items-center justify-center rounded border font-mono transition-all duration-100"
  const sizeStyles = variant === "small" ? "h-6 min-w-[1.5rem] px-1.5 text-[10px]" : "h-8 min-w-[3rem] px-2 text-xs"
  const stateStyles = isPressed
    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
    : "border-zinc-700 bg-zinc-800/50 text-zinc-500"

  return <kbd className={`${baseStyles} ${sizeStyles} ${stateStyles}`}>{displayLabel}</kbd>
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

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

  const isKeyPressed = useCallback(
    (key: string) => {
      const k = key.toLowerCase()
      if (k === "cmd" || k === "meta" || k === "mod") return pressedKeys.meta
      if (k === "ctrl" || k === "control") return pressedKeys.ctrl
      if (k === "shift") return pressedKeys.shift
      if (k === "alt" || k === "option") return pressedKeys.alt
      return pressedKeys.key === k || pressedKeys.key === key
    },
    [pressedKeys],
  )

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

  // Shortcuts registration
  const save = $.cmd.key("s").on(() => addLog("cmd+s", "Save"))
  const commandPalette = $.cmd.shift.key("p").on(() => addLog("cmd+shift+p", "Command Palette"))
  const superCombo = $.ctrl.shift.alt.cmd.key("a").on(() => addLog("ctrl+shift+alt+cmd+a", "Super Combo!"))
  const crossPlatform = $.mod.key("k").on(() => addLog("mod+k", "Search"))
  const delayed = $.mod.shift.key("d").on(
    () => {
      setCounter((c) => c + 1)
      addLog("mod+shift+d", "Delayed +1", "success")
    },
    { delay: 500 },
  )
  const help = $.key("f1").on(() => addLog("f1", "Help opened"))
  const escape = $.key("escape").on(() => addLog("escape", "Cancelled"))
  const slashFocus = $.key("slash").except("typing").on(focusEditor)

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
              <KeyCap key={mod} label={mod} isPressed={isKeyPressed(mod)} />
            ))}
            <span className="mx-2 flex items-center text-zinc-600">+</span>
            <KeyCap
              label={pressedKeys.key && !["Control", "Shift", "Alt", "Meta"].includes(pressedKeys.key) ? pressedKeys.key : "Key"}
              isPressed={!!pressedKeys.key && !["Control", "Shift", "Alt", "Meta"].includes(pressedKeys.key)}
            />
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
                    className={`flex items-center justify-between rounded-lg border p-3 transition-all duration-150 ${isHighlighted
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
                          <KeyCap label={key} isPressed={isKeyPressed(key)} variant="small" />
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
                    className={`flex items-center justify-between rounded border p-2 ${log.status === "success"
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : log.status === "late"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-red-500/30 bg-red-500/5"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${log.status === "success"
                            ? "bg-emerald-500"
                            : log.status === "late"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                      />
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs ${log.status === "success"
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

      <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-zinc-100">Editor Demo</CardTitle>
          <CardDescription className="text-zinc-500">
            Press <KeyCap label="/" isPressed={isKeyPressed("/")} variant="small" /> outside to focus • typing "/" inside
            won't trigger the shortcut
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
