"use client"

import { useState } from "react"
import { useKeyboardShortcuts, ModifierAliases, ModifierKey, ModifierDisplaySymbols } from "@/core/keyboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"

export function KeyboardShortcutsDemo() {
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [actionCount, setActionCount] = useState(0)

  const shortcuts = [
    {
      shortcut: "mod+s",
      handler: () => logAction("Save"),
      description: "Save document",
    },
    {
      shortcut: "mod+shift+p",
      handler: () => logAction("Command Palette"),
      description: "Open command palette",
    },
    {
      shortcut: ["mod+k", "mod+/"],
      handler: () => logAction("Search"),
      description: "Quick search",
    },
    {
      shortcut: "mod+shift+n",
      handler: () => logAction("New Window"),
      description: "Open new window",
    },
    {
      shortcut: "mod+alt+t",
      handler: () => logAction("Terminal"),
      description: "Toggle terminal",
    },
    {
      shortcut: "escape",
      handler: () => logAction("Escape"),
      description: "Close/Cancel",
    },
  ]

  const { formatShortcut, platform } = useKeyboardShortcuts(shortcuts)

  function logAction(action: string) {
    setLastAction(action)
    setActionCount((c) => c + 1)
  }

  const symbols = ModifierDisplaySymbols[platform]

  return (
    <div className="space-y-8">
      {/* Last Action Display */}
      <Card className="border-2 border-dashed">
        <CardContent className="py-8 text-center">
          {lastAction ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Last triggered:</p>
              <p className="text-3xl font-bold">{lastAction}</p>
              <Badge variant="secondary">{actionCount} actions</Badge>
            </div>
          ) : (
            <p className="text-muted-foreground">Try pressing any shortcut below!</p>
          )}
        </CardContent>
      </Card>

      {/* Available Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Available Shortcuts</CardTitle>
          <CardDescription>Platform: {platform.toUpperCase()} — Try these shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {shortcuts.map((shortcut, i) => {
              const keys = Array.isArray(shortcut.shortcut) ? shortcut.shortcut : [shortcut.shortcut]

              return (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{shortcut.description}</span>
                  <div className="flex gap-2">
                    {keys.map((key) => (
                      <kbd key={key} className="bg-muted rounded-md px-2 py-1 font-mono text-sm">
                        {formatShortcut(key)}
                      </kbd>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modifier Key Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Modifier Key Reference</CardTitle>
          <CardDescription>Platform-specific symbols for {platform}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(ModifierKey).map(([name, key]) => (
              <div key={key} className="flex flex-col items-center gap-2 rounded-lg border p-4">
                <kbd className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-xl font-bold">
                  {symbols[key]}
                </kbd>
                <span className="text-muted-foreground text-sm capitalize">{name.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alias Map */}
      <Card>
        <CardHeader>
          <CardTitle>Easy Language Aliases</CardTitle>
          <CardDescription>All the friendly names you can use in shortcut definitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
            {Object.entries(ModifierAliases).map(([alias, modifier]) => (
              <div key={alias} className="flex items-center justify-between py-1">
                <code className="text-sm font-semibold text-blue-600 dark:text-blue-400">{alias}</code>
                <span className="text-muted-foreground text-xs">→ {modifier}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
