"use client"

import { CodeBlock } from "@/shared/components/code-block/code-block"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"

export function UsageExamples() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zinc-100">Recipes & Examples</h2>
                <p className="text-zinc-500">Common patterns and usage guidelines for useShortcut</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Configuration & Debugging */}
                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Configuration & Debugging</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Enable debug mode to see logs in your browser console
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CodeBlock
                            language="typescript"
                            code={`const $ = useShortcut({
  // Log every key press and shortcut match to console
  debug: true,

  // Global delay for all shortcuts (e.g. for animations)
  delay: 100,

  // Don't trigger shortcuts when typing in inputs
  ignoreInputs: true,

  // Temporarily disable all shortcuts
  disabled: false
})`}
                        />
                    </CardContent>
                </Card>

                {/* Preventing Default Behavior */}
                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Preventing Default</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Stop browser actions (like Ctrl+S saving a webpage)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CodeBlock
                            language="typescript"
                            code={`// Prevent browser's "Save Page As"
$.mod.key("s").on(saveDocument, {
  preventDefault: true
})

// Prevent standard "Find"
$.mod.key("f").on(openCustomFind, {
  preventDefault: true,
  stopPropagation: true
})`}
                        />
                    </CardContent>
                </Card>

                {/* Scoped Shortcuts (Except) */}
                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Scoped Shortcuts</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Control exactly when shortcuts are active
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CodeBlock
                            language="typescript"
                            code={`// Allow "/" to focus search EXCEPT when typing
$.key("/")
  .except("typing") // Built-in preset
  .on(focusSearch)

// Escape key for modal EXCEPT if no modal is open
$.key("escape")
  .except((e) => !isModalOpen) // Custom predicate
  .on(closeModal)

// Allow Ctrl+Enter to submit form even inside textarea
$.ctrl.key("enter")
  .except("disabled") // Only check if disabled
  .on(submitForm)`}
                        />
                    </CardContent>
                </Card>

                {/* Global vs Local */}
                <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Effect Cleanup</CardTitle>
                        <CardDescription className="text-zinc-500">
                            Shortcuts are automatically unbound on unmount
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CodeBlock
                            language="typescript"
                            code={`function MyComponent() {
  const $ = useShortcut()

  // This shortcut exists only while 
  // MyComponent is mounted
  $.mod.key("j").on(toggleSidebar)
  
  return <div>...</div>
}
// Clean up happens automatically! 🧹`}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
