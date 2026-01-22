"use client"

import { useShortcut, parseShortcut, formatShortcut, detectPlatform, Platform } from "@/core/keyboard"
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Switch } from "@/shared/components/ui/switch"
import { Label } from "@/shared/components/ui/label"
import { Input } from "@/shared/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"

type ShortcutLog = {
  id: number
  combo: string
  display: string
  time: string
  status: "success" | "missed" | "late"
}

type KeyState = {
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
  key: string | null
}

type KeyCapProps = {
  label: string
  isPressed: boolean
  variant?: "small" | "large"
}

function KeyCap({ label, isPressed, variant = "large" }: KeyCapProps) {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")

  const displayLabel = useMemo(() => {
    const l = label.toLowerCase()
    if (l === "cmd" || l === "mod" || l === "meta") return isMac ? "⌘" : "Ctrl"
    if (l === "shift") return "⇧"
    if (l === "alt" || l === "option") return "⌥"
    if (l === "ctrl" || l === "control") return "⌃"
    if (l === "enter") return "↵"
    if (l === "escape") return "Esc"
    if (l === "backspace") return "⌫"
    return label.length === 1 ? label.toUpperCase() : label
  }, [label, isMac])

  const baseStyles = "inline-flex items-center justify-center rounded border font-mono transition-all duration-100 select-none"
  const sizeStyles = variant === "small" ? "h-6 min-w-[1.5rem] px-1.5 text-[10px]" : "h-8 min-w-[3rem] px-2 text-xs"
  const stateStyles = isPressed
    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
    : "border-zinc-700 bg-zinc-800/50 text-zinc-500"

  return <kbd className={`${baseStyles} ${sizeStyles} ${stateStyles}`}>{displayLabel}</kbd>
}

function PropsTable({
  data,
}: {
  data: Array<{ prop: string; type: string; default?: string; description: string }>
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/50">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80">
            <th className="p-4 font-medium text-zinc-300">Prop</th>
            <th className="p-4 font-medium text-zinc-300">Type</th>
            <th className="p-4 font-medium text-zinc-300">Default</th>
            <th className="p-4 font-medium text-zinc-300">Description</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.prop} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
              <td className="p-4 font-mono text-emerald-400">{row.prop}</td>
              <td className="p-4 font-mono text-zinc-400">{row.type}</td>
              <td className="p-4 font-mono text-zinc-500">{row.default || "-"}</td>
              <td className="p-4 text-zinc-400">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ShortcutDemo() {
  // State
  const [logs, setLogs] = useState<ShortcutLog[]>([])
  const [counter, setCounter] = useState(0)
  const [editorContent, setEditorContent] = useState("")
  const [highlightedCombo, setHighlightedCombo] = useState<string | null>(null)

  // Playground State
  const [playgroundInput, setPlaygroundInput] = useState("cmd+k")
  const [parsedPlayground, setParsedPlayground] = useState<any>(null)

  // Options State
  const [options, setOptions] = useState({
    debug: true,
    ignoreInputs: true,
    disabled: false,
    delay: 0,
  })

  // Key tracking
  const [pressedKeys, setPressedKeys] = useState<KeyState>({
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: null,
  })

  // Key listener for visualization
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      setPressedKeys({
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
        key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
      })
    }
    function handleKeyUp() {
      setPressedKeys({ ctrl: false, shift: false, alt: false, meta: false, key: null })
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Parse playground input
  useEffect(() => {
    try {
      const parsed = parseShortcut(playgroundInput)
      setParsedPlayground({
        parsed,
        formatted: formatShortcut(playgroundInput, detectPlatform())
      })
    } catch (e) {
      setParsedPlayground(null)
    }
  }, [playgroundInput])

  // Callbacks
  const addLog = useCallback((combo: string, display: string, status: ShortcutLog["status"] = "success") => {
    setHighlightedCombo(combo)
    setTimeout(() => setHighlightedCombo(null), 300)
    setLogs((prev) => [
      { id: Date.now(), combo, display, time: new Date().toLocaleTimeString(), status },
      ...prev.slice(0, 9),
    ])
  }, [])

  const isKeyPressed = useCallback((key: string) => {
    const k = key.toLowerCase()
    if (k === "cmd" || k === "meta" || k === "mod") return pressedKeys.meta
    if (k === "ctrl" || k === "control") return pressedKeys.ctrl
    if (k === "shift") return pressedKeys.shift
    if (k === "alt" || k === "option") return pressedKeys.alt
    return pressedKeys.key === k || pressedKeys.key === key
  }, [pressedKeys])

  // --- SHORTCUT REGISTRATION ---
  const $ = useShortcut(options)

  const save = $.cmd.key("s").on(() => addLog("cmd+s", "Save"))
  const commandPalette = $.cmd.shift.key("p").on(() => addLog("cmd+shift+p", "Command Palette"))
  const superCombo = $.ctrl.shift.alt.cmd.key("a").on(() => addLog("ctrl+shift+alt+cmd+a", "Super Combo!"))
  const crossPlatform = $.mod.key("k").on(() => addLog("mod+k", "Search"))
  const delayed = $.mod.shift.key("d").on(
    () => {
      setCounter((c) => c + 1)
      addLog("mod+shift+d", `Delayed +1 (${counter + 1})`)
    },
    { delay: 500 },
  )
  const help = $.key("f1").on(() => addLog("f1", "Help opened"))
  const escape = $.key("escape").on(() => addLog("escape", "Cancelled"))
  const slashFocus = $.key("slash").except("typing").on(() => {
    document.getElementById("demo-editor")?.focus()
    addLog("slash", "Focus Editor")
  })

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

  // Data for props tables
  const useShortcutProps = [
    { prop: "debug", type: "boolean", default: "false", description: "Log all shortcut events to console" },
    { prop: "delay", type: "number", default: "0", description: "Global delay for all shortcuts in ms" },
    { prop: "ignoreInputs", type: "boolean", default: "true", description: "Ignore shortcuts in inputs/textareas" },
    { prop: "disabled", type: "boolean", default: "false", description: "Disable all shortcuts for this hook" },
    { prop: "target", type: "HTMLElement | Window", default: "window", description: "Element to attach listeners to" },
    { prop: "eventType", type: "'keydown' | 'keyup'", default: "'keydown'", description: "Event to listen for" },
  ]

  const handlerProps = [
    { prop: "preventDefault", type: "boolean", default: "true", description: "Prevent browser default action" },
    { prop: "stopPropagation", type: "boolean", default: "false", description: "Stop event bubbling" },
    { prop: "delay", type: "number", default: "0", description: "Delay handler execution in ms" },
    { prop: "disabled", type: "boolean", default: "false", description: "Temporarily disable this specific shortcut" },
    { prop: "except", type: "Preset | Preset[] | fn", default: "-", description: "Condition to skip execution (e.g. 'typing')" },
  ]

  return (
    <div className="space-y-12">
      {/* 1. Live State & Playground */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-zinc-100">Live Key State</CardTitle>
            <CardDescription className="text-zinc-500">Visualizes what the library "sees"</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-3xl">
              {["Ctrl", "Alt", "Shift", "Cmd"].map((mod) => (
                <KeyCap key={mod} label={mod} isPressed={isKeyPressed(mod)} />
              ))}
              <span className="mx-2 flex items-center text-zinc-600">+</span>
              <KeyCap
                label={pressedKeys.key && !["Control", "Shift", "Alt", "Meta", "Command", "Option"].includes(pressedKeys.key) ? pressedKeys.key : "?"}
                isPressed={!!pressedKeys.key && !["Control", "Shift", "Alt", "Meta", "Command", "Option"].includes(pressedKeys.key)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-zinc-100">Playground</CardTitle>
            <CardDescription className="text-zinc-500">Test shortcut string parsing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={playgroundInput}
                onChange={e => setPlaygroundInput(e.target.value)}
                placeholder="e.g. cmd+shift+k"
                className="bg-zinc-950 border-zinc-700 font-mono text-zinc-200"
              />
            </div>
            {parsedPlayground ? (
              <div className="rounded bg-zinc-950 p-3 font-mono text-xs">
                <div className="flex justify-between border-b border-zinc-800 pb-2 mb-2">
                  <span className="text-zinc-500">Formatted:</span>
                  <span className="text-emerald-400 font-bold">{parsedPlayground.formatted}</span>
                </div>
                <div className="space-y-1 text-zinc-400">
                  <div>Key: <span className="text-zinc-200">{parsedPlayground.parsed.key}</span></div>
                  <div>Modifiers: <span className="text-zinc-200">{JSON.stringify(parsedPlayground.parsed.modifiers)}</span></div>
                </div>
              </div>
            ) : (
              <div className="text-red-400 text-sm">Invalid shortcut string</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Interactive Demo */}
      <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100">Interactive Demo</CardTitle>
            <CardDescription className="text-zinc-500">Try these registered shortcuts</CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="debug-mode" className="text-xs text-zinc-400">Debug Mode</Label>
              <Switch id="debug-mode" checked={options.debug} onCheckedChange={c => setOptions(o => ({ ...o, debug: c }))} />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ignore-inputs" className="text-xs text-zinc-400">Ignore Inputs</Label>
              <Switch id="ignore-inputs" checked={options.ignoreInputs} onCheckedChange={c => setOptions(o => ({ ...o, ignoreInputs: c }))} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* List */}
            <div className="space-y-2">
              {shortcuts.map(({ result, name, keys, hasExcept }) => {
                const isHighlighted = highlightedCombo === result.combo
                return (
                  <div
                    key={result.combo}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-all duration-150 ${isHighlighted
                      ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "border-zinc-800 bg-zinc-950/50"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-300">{name}</span>
                      {hasExcept && (
                        <Badge variant="outline" className="border-amber-500/30 text-[10px] text-amber-500">.except("typing")</Badge>
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

            {/* Logs + Editor */}
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 h-48 overflow-y-auto">
                <h4 className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Event Log</h4>
                <div className="space-y-2">
                  {logs.map(log => (
                    <div key={log.id} className="flex justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-zinc-300">{log.display}</span>
                      </div>
                      <span className="text-zinc-600 font-mono">{log.time}</span>
                    </div>
                  ))}
                  {logs.length === 0 && <span className="text-zinc-700 italic text-xs">Waiting for input...</span>}
                </div>
              </div>

              <textarea
                id="demo-editor"
                value={editorContent}
                onChange={e => setEditorContent(e.target.value)}
                placeholder="Type here to test .except('typing')..."
                className="w-full h-24 rounded border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-300 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. API Documentation */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-zinc-100">API Documentation</h2>

        <Tabs defaultValue="options">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="options">useShortcut Options</TabsTrigger>
            <TabsTrigger value="handler">Handler Options</TabsTrigger>
          </TabsList>
          <TabsContent value="options" className="mt-4">
            <PropsTable data={useShortcutProps} />
          </TabsContent>
          <TabsContent value="handler" className="mt-4">
            <PropsTable data={handlerProps} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
