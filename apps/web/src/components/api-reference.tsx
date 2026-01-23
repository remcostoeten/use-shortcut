"use client"

import { useState } from "react"
import { Check, Copy, Terminal } from "lucide-react"

export function ApiReference() {
    return (
        <div className="space-y-16">
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-zinc-100">API Reference</h2>

                <div className="space-y-8">
                    <TableSection
                        title="Hook Options"
                        description="Pass these options to the useShortcut hook."
                        headers={["Option", "Type", "Default", "Description"]}
                        rows={[
                            {
                                cells: ["debug", "boolean", "false", "Log key presses and matches to console"],
                                example: 'useShortcut({ debug: true })'
                            },
                            {
                                cells: ["delay", "number", "0", "Global debounce delay in ms"],
                                example: 'useShortcut({ delay: 300 })'
                            },
                            {
                                cells: ["ignoreInputs", "boolean", "true", "Skip shortcuts in inputs/textareas"],
                                example: 'useShortcut({ ignoreInputs: false }) // Allow in inputs'
                            },
                            {
                                cells: ["disabled", "boolean", "false", "Disable all shortcuts globally"],
                                example: 'useShortcut({ disabled: isLoading })'
                            },
                            {
                                cells: ["eventType", "'keydown' | 'keyup'", "'keydown'", "Event to listen for"],
                                example: 'useShortcut({ eventType: "keyup" })'
                            },
                            {
                                cells: ["target", "HTMLElement | Window", "window", "Event listener target"],
                                example: 'useShortcut({ target: document.body })'
                            },
                        ]}
                    />

                    <TableSection
                        title="Modifiers"
                        description="Chainable modifiers. Use exactly one per key in the combo."
                        headers={["Modifier", "Description"]}
                        rows={[
                            {
                                cells: [".mod", "Platform-aware: Cmd (Mac) or Ctrl (Win/Linux)"],
                                example: '$.mod.key("s").on(save) // ⌘S or Ctrl+S'
                            },
                            {
                                cells: [".ctrl", "Control key"],
                                example: '$.ctrl.key("c").on(copy)'
                            },
                            {
                                cells: [".alt", "Alt / Option key"],
                                example: '$.alt.key("delete").on(deleteItem)'
                            },
                            {
                                cells: [".shift", "Shift key"],
                                example: '$.shift.key("?").on(help)'
                            },
                            {
                                cells: [".cmd", "Command (Mac) / Windows key"],
                                example: '$.cmd.key("k").on(clear)'
                            },
                        ]}
                    />

                    <TableSection
                        title="Methods"
                        description="Methods available on the shortcut builder chain."
                        headers={["Method", "Arguments", "Description"]}
                        rows={[
                            {
                                cells: [".key()", "key: string", "The final key to listen for (e.g. \"s\", \"enter\")"],
                                example: '$.mod.key("enter").on(submit)'
                            },
                            {
                                cells: [".on()", "handler, options?", "Registers the shortcut handler"],
                                example: '$.key("x").on(() => console.log("X"))'
                            },
                            {
                                cells: [".except()", "predicate | preset", "Condition to skip execution (e.g. \"typing\")"],
                                example: '$.key("/").except("typing").on(search)'
                            },
                            {
                                cells: [".handle()", "options", "Alternative to .on() with object arguments"],
                                example: '$.key("esc").handle({ handler: close, preventDefault: true })'
                            },
                        ]}
                    />
                </div>
            </div>
        </div>
    )
}

function TableSection({ title, description, headers, rows }: {
    title: string
    description: string
    headers: string[]
    rows: { cells: string[], example?: string }[]
}) {
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-lg font-medium text-zinc-200">{title}</h3>
                <p className="text-sm text-zinc-400">{description}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-900 text-zinc-400 font-medium border-b border-zinc-800">
                            <tr>
                                {headers.map((h, i) => (
                                    <th key={i} className="px-4 py-3 whitespace-nowrap">{h}</th>
                                ))}
                                {/* Empty header for example column */}
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {rows.map((row, i) => (
                                <tr key={i} className="group hover:bg-zinc-900/50 transition-colors">
                                    {row.cells.map((cell, j) => (
                                        <td key={j} className={`px-4 py-3 ${j === 0 ? "font-mono text-emerald-400" : "text-zinc-300"}`}>
                                            {cell}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right">
                                        {row.example && <ExampleButton code={row.example} />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function ExampleButton({ code }: { code: string }) {
    const [copied, setCopied] = useState(false)

    const copy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="relative inline-flex items-center justify-end">
            <button
                onClick={copy}
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors relative z-10 peer"
            >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Terminal className="w-4 h-4" />}
            </button>

            {/* Tooltip on peer hover */}
            <div className="absolute right-full mr-2 z-20 opacity-0 peer-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap hidden md:block">
                <div className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 shadow-xl flex items-center gap-3">
                    <code className="text-xs font-mono text-emerald-400">{code}</code>
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                        {copied ? "Copied" : "Click to copy"}
                    </span>
                </div>
            </div>
        </div>
    )
}
