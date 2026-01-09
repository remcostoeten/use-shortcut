import { ShortcutDemo } from "@/components/shortcut-demo"
import { CodeBlock } from "@/components/code-block"

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100">Keyboard Shortcuts System</h1>
          <p className="text-lg text-zinc-500">Enterprise-grade chainable API with perfect TypeScript intellisense</p>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">Chainable Syntax</h2>
            <CodeBlock
              language="typescript"
              code={`// Create builder
const $ = useShortcut({ debug: true })

// Single modifier
$.cmd.key("s").on(save)

// Multiple modifiers
$.ctrl.shift.key("p").on(palette)

// Cross-platform mod key
$.mod.key("k").on(search)`}
            />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">
              <span className="text-cyan-400">.except()</span> API
            </h2>
            <CodeBlock
              language="typescript"
              code={`// Skip when user is typing
$.key("/")
  .except("typing")
  .on(focusSearch)

// Built-in presets:
"input"     // input/textarea/select
"editable"  // contenteditable
"typing"    // input + editable
"modal"     // [data-modal]
"disabled"  // [disabled]

// Custom predicate
.except((e) => e.target.id === "skip")`}
            />
          </div>
        </div>

        <ShortcutDemo />

        <div className="mt-8 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-400/80">
            <span className="font-semibold">Debug Mode Enabled:</span> Open your browser console to see all shortcut
            registrations and key presses logged in real-time.
          </p>
        </div>
      </div>
    </main>
  )
}
