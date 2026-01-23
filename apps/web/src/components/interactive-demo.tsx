'use client'

import { useShortcut } from '@remcostoeten/use-shortcut'
import { useState } from 'react'

type ShortcutInfo = {
    name: string
    keys: string[]
    display: string
    syntax: string
}

export function InteractiveDemo() {
    const [lastTriggered, setLastTriggered] = useState<string | null>(null)
    const [lastSyntax, setLastSyntax] = useState<string | null>(null)
    const [triggerCount, setTriggerCount] = useState(0)
    const $ = useShortcut()

    function flash(name: string, syntax: string) {
        setLastTriggered(name)
        setLastSyntax(syntax)
        setTriggerCount(c => c + 1)
        setTimeout(() => {
            setLastTriggered(null)
            setLastSyntax(null)
        }, 3000)
    }

    const saveSyntax = `$.mod.key("s").on(save)`
    const searchSyntax = `$.mod.key("k").on(openSearch)`
    const paletteSyntax = `$.ctrl.shift.key("p").on(openPalette)`

    const save = $.mod.key('s').on((e: KeyboardEvent) => {
        e.preventDefault()
        flash('Save', saveSyntax)
    })

    const search = $.mod.key('k').on((e: KeyboardEvent) => {
        e.preventDefault()
        flash('Search', searchSyntax)
    })

    const palette = $.ctrl.shift.key('p').on((e: KeyboardEvent) => {
        e.preventDefault()
        flash('Command Palette', paletteSyntax)
    })

    const shortcuts: ShortcutInfo[] = [
        { name: 'Save', keys: ['⌘', 'S'], display: save.display, syntax: saveSyntax },
        { name: 'Search', keys: ['⌘', 'K'], display: search.display, syntax: searchSyntax },
        { name: 'Palette', keys: ['Ctrl', 'Shift', 'P'], display: palette.display, syntax: paletteSyntax },
    ]

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-zinc-500">Try it — press any shortcut:</span>
                {triggerCount > 0 && (
                    <span className="text-xs text-zinc-600">{triggerCount} triggered</span>
                )}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                {shortcuts.map((shortcut) => (
                    <div
                        key={shortcut.name}
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
                            ${lastTriggered === shortcut.name
                                ? 'border-zinc-500/50 bg-zinc-800 scale-105 shadow-lg shadow-zinc-950/50'
                                : 'border-zinc-800/50 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/30'
                            }
                        `}
                    >
                        <div className="flex gap-1">
                            {shortcut.keys.map((key, i) => (
                                <kbd
                                    key={i}
                                    className={`
                                        px-1.5 py-0.5 rounded text-xs font-mono border min-w-[20px] text-center
                                        ${lastTriggered === shortcut.name
                                            ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'
                                        }
                                    `}
                                >
                                    {key}
                                </kbd>
                            ))}
                        </div>
                        <span className={`text-sm transition-colors ${lastTriggered === shortcut.name ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}>
                            {shortcut.name}
                        </span>
                    </div>
                ))}
            </div>

            {lastTriggered && lastSyntax && (
                <div className="rounded-lg bg-zinc-100/5 border border-zinc-100/10 p-4 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-zinc-100 font-medium">{lastTriggered}</span>
                        <span className="text-zinc-500">triggered</span>
                    </div>
                    <div className="bg-zinc-950/50 rounded-md px-4 py-2 font-mono text-sm text-center border border-zinc-800/50">
                        <code className="text-zinc-300">{lastSyntax}</code>
                    </div>
                </div>
            )}

            {!lastTriggered && (
                <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 px-4 py-3 text-center text-zinc-500 text-sm">
                    Press a shortcut to see the syntax...
                </div>
            )}
        </div>
    )
}
