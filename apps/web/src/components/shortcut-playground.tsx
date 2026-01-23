"use client"

import { Editor } from "@monaco-editor/react"
import { useShortcut } from "@remcostoeten/use-shortcut"
import { useEffect, useState, useRef } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select"



const MODIFIERS = ["mod", "ctrl", "alt", "shift", "cmd"]
const ALL_KEYS = "abcdefghijklmnopqrstuvwxyz0123456789".split("")

export function ShortcutPlayground() {
    const [actionName, setActionName] = useState("Save")
    const [selectedMods, setSelectedMods] = useState<string[]>(["mod"])
    const [selectedKey, setSelectedKey] = useState("s")
    const [code, setCode] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [triggerLog, setTriggerLog] = useState<{ id: number, msg: string }[]>([])

    const editorRef = useRef<any>(null)
    const monacoRef = useRef<any>(null)
    const decorationsRef = useRef<any>([])

    function handleEditorDidMount(editor: any, monaco: any) {
        editorRef.current = editor
        monacoRef.current = monaco
    }

    // Highlight the 3rd line (where the chain is) whenever it changes
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return

        // The chain definition is always on line 3 based on our template
        const range = new monacoRef.current.Range(3, 1, 3, 1)

        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
            {
                range: new monacoRef.current.Range(3, 1, 3, 1000),
                options: {
                    isWholeLine: true,
                    className: 'bg-zinc-800/30 border-l-2 border-zinc-700',
                    linesDecorationsClassName: 'bg-zinc-700 w-1'
                }
            }
        ])
    }, [code, selectedMods, selectedKey])

    useEffect(() => {
        const modsChain = selectedMods.length > 0 ? selectedMods.map(m => `.${m}`).join("") : ""
        const chain = `$.${modsChain.replace(/^\./, "")}${modsChain ? "." : ""}key("${selectedKey}")`

        const newCode = `const $ = useShortcut()

${chain}.on(async (e) => {
    e.preventDefault()

    try {
        await new Promise(r => setTimeout(r, 100))
    } catch (err) {
        console.error("❌ Error:", err)
    }
})`
        setCode(newCode)
    }, [actionName, selectedMods, selectedKey])

    const $ = useShortcut()

    useEffect(() => {
        try {
            const mods = selectedMods
            const k = selectedKey

            let chain: any = $

            if (mods.includes("mod")) chain = chain.mod
            if (mods.includes("ctrl")) chain = chain.ctrl
            if (mods.includes("alt")) chain = chain.alt
            if (mods.includes("shift")) chain = chain.shift
            if (mods.includes("cmd")) chain = chain.cmd

            try {
                chain.key(k).on((e: KeyboardEvent) => {
                    e.preventDefault()
                    setTriggerLog(prev => [
                        { id: Date.now(), msg: `${actionName} (${new Date().toLocaleTimeString()})` },
                        ...prev.slice(0, 4)
                    ])
                })

                setError(null)
                return () => { }
            } catch (err: any) {
                setError(`Runtime Error: ${err.message}`)
            }

        } catch (err: any) {
            setError(`Configuration Error: ${err.message}`)
        }
    }, [$, selectedMods, selectedKey, actionName])

    function handleEditorChange(value: string | undefined) {
        if (value) setCode(value)
    }

    const displayCombo = selectedMods.map(m => {
        if (m === "mod") return "⌘"
        if (m === "ctrl") return "Ctrl"
        if (m === "alt") return "Alt"
        if (m === "shift") return "⇧"
        if (m === "cmd") return "⌘"
        return m
    }).join("") + selectedKey.toUpperCase()

    return (
        <div className="w-full max-w-5xl mx-auto px-4">
            <div className="border border-zinc-800 bg-zinc-900 overflow-hidden">

                <div className="border-b border-zinc-800 bg-zinc-900 p-6">
                    <div className="flex flex-wrap gap-6 items-end">

                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Action Name
                            </label>
                            <input
                                type="text"
                                value={actionName}
                                onChange={(e) => setActionName(e.target.value)}
                                className="flex h-9 w-40 rounded-none border border-zinc-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-100 placeholder:text-zinc-500"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Modifiers
                            </label>
                            <div className="flex gap-1">
                                {MODIFIERS.map(mod => (
                                    <button
                                        key={mod}
                                        onClick={() => {
                                            setSelectedMods(prev =>
                                                prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
                                            )
                                        }}
                                        className={`inline-flex items-center justify-center h-9 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:pointer-events-none disabled:opacity-50 border border-zinc-800 shadow-sm hover:bg-zinc-800 hover:text-zinc-100 ${selectedMods.includes(mod)
                                            ? "bg-zinc-100 text-zinc-950 border-zinc-100 hover:bg-zinc-200 hover:text-zinc-950"
                                            : "bg-transparent text-zinc-400"
                                            }`}
                                    >
                                        {mod}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Key
                            </label>
                            <Select value={selectedKey} onValueChange={setSelectedKey}>
                                <SelectTrigger className="w-[4.5rem] h-9 rounded-none border-zinc-800 bg-zinc-950 text-zinc-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    {ALL_KEYS.map(k => (
                                        <SelectItem
                                            key={k}
                                            value={k}
                                            className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100"
                                        >
                                            {k.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 flex justify-end">
                            <div className="flex items-center gap-3 px-4 py-2 border border-zinc-800 bg-zinc-950/50">
                                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Press</span>
                                <kbd className="inline-flex h-6 items-center justify-center border border-zinc-700 bg-zinc-900 px-2.5 font-mono text-sm font-medium text-zinc-100 shadow-[0_1px_0_1px_rgba(0,0,0,0.2)]">
                                    {displayCombo}
                                </kbd>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">

                    <div className="h-[280px] relative group bg-zinc-950">
                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-mono bg-zinc-900 px-2 py-1 border border-zinc-800">
                                Generated Code
                            </span>
                        </div>
                        <Editor
                            height="100%"
                            defaultLanguage="typescript"
                            value={code}
                            onMount={handleEditorDidMount}
                            onChange={handleEditorChange}
                            theme="zinc-dark"
                            beforeMount={(monaco) => {
                                monaco.editor.defineTheme("zinc-dark", {
                                    base: "vs-dark",
                                    inherit: true,
                                    rules: [],
                                    colors: {
                                        "editor.background": "#09090b",
                                    }
                                })
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                readOnly: true,
                                padding: { top: 20, bottom: 20 },
                                renderLineHighlight: "none",
                                cursorStyle: "line",
                                scrollbar: {
                                    vertical: "hidden",
                                    horizontal: "hidden"
                                },
                                overviewRulerBorder: false,
                                hideCursorInOverviewRuler: true,
                            }}
                        />
                    </div>

                    <div className="h-[280px] bg-zinc-950 p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <span className={`w-2 h-2 ${error ? "bg-red-500" : "bg-emerald-500"}`} />
                                Console Output
                            </h3>
                            {triggerLog.length > 0 && (
                                <button
                                    onClick={() => setTriggerLog([])}
                                    className="text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1 hover:bg-zinc-800"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="flex-1 bg-zinc-900 border border-zinc-800 p-4 font-mono text-sm overflow-y-auto">
                            {error ? (
                                <div className="text-red-400 p-3 bg-red-500/10 border border-red-500/20">
                                    {error}
                                </div>
                            ) : triggerLog.length === 0 ? (
                                <div className="text-zinc-600 space-y-2">
                                    <div className="opacity-70">Waiting for keyboard input...</div>
                                    <div className="text-zinc-500">
                                        Press <span className="text-zinc-300 font-semibold">{displayCombo}</span> to trigger
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {triggerLog.map(log => (
                                        <div key={log.id} className="flex gap-2">
                                            <span className="text-emerald-400">→</span>
                                            <span className="text-zinc-200">"{log.msg} triggered!"</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
