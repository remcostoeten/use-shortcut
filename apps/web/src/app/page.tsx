import { CodeBlock } from "@/shared/components/code-block/code-block"

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="container mx-auto max-w-4xl space-y-12">

        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">useShortcut</h1>
          <p className="text-xl text-zinc-400">
            Chainable keyboard shortcuts for React with perfect TypeScript intellisense.
          </p>
        </div>

        {/* Installation */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-100">Installation</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <CodeBlock
              language="bash"
              code={`npm install @remcostoeten/use-shortcut
# or
pnpm add @remcostoeten/use-shortcut
# or
bun add @remcostoeten/use-shortcut`}
            />
          </div>
        </section>

        {/* Builder API Table */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-100">Builder API</h2>
          <p className="text-zinc-400">The chainable methods available on the shortcut builder.</p>

          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="border-b border-zinc-800 p-4 font-medium text-zinc-300">Method</th>
                  <th className="border-b border-zinc-800 p-4 font-medium text-zinc-300">Description</th>
                  <th className="border-b border-zinc-800 p-4 font-medium text-zinc-300">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                <tr>
                  <td className="p-4 font-mono text-cyan-400">mod / cmd / ctrl...</td>
                  <td className="p-4 text-zinc-400">Adds a modifier. <code className="text-zinc-300">mod</code> is cross-platform (⌘ on Mac, Ctrl on Win).</td>
                  <td className="p-4 font-mono text-zinc-500">shortcut.mod.shift</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-cyan-400">key(char)</td>
                  <td className="p-4 text-zinc-400">Specifies the action key. Must be the last step before handlers.</td>
                  <td className="p-4 font-mono text-zinc-500">.key("s")</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-cyan-400">except(condition)</td>
                  <td className="p-4 text-zinc-400">
                    condition to skip the shortcut.
                    <br />Presets: <code className="text-xs">"input" | "typing" | "modal"</code>
                  </td>
                  <td className="p-4 font-mono text-zinc-500">.except("typing")</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-cyan-400">on(handler)</td>
                  <td className="p-4 text-zinc-400">Registers the event listener. Returns a result object to control it.</td>
                  <td className="p-4 font-mono text-zinc-500">.on(saveFile)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Hook Options Table */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-100">Hook Options</h2>
          <p className="text-zinc-400">Configuration object passed to <code className="font-mono text-cyan-400">useShortcut(options)</code>.</p>

          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="border-b border-zinc-800 p-4 font-medium text-zinc-300">Option</th>
                  <th className="border-b border-zinc-800 p-4 font-medium text-zinc-300">Default</th>
                  <th className="border-b border-zinc-800 p-4 font-medium text-zinc-300">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                <tr>
                  <td className="p-4 font-mono text-cyan-400">ignoreInputs</td>
                  <td className="p-4 text-zinc-500">true</td>
                  <td className="p-4 text-zinc-400">If true, shortcuts won't trigger in <code className="text-xs">input/textarea/select</code>.</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-cyan-400">debug</td>
                  <td className="p-4 text-zinc-500">false</td>
                  <td className="p-4 text-zinc-400">Logs key presses and shortcut matches to console.</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-cyan-400">delay</td>
                  <td className="p-4 text-zinc-500">0</td>
                  <td className="p-4 text-zinc-400">Debounce delay in milliseconds before triggering handler.</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-cyan-400">blockedByModal</td>
                  <td className="p-4 text-zinc-500">false</td>
                  <td className="p-4 text-zinc-400">If true, prevents shortcuts when a modal is open.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Examples */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-zinc-100">Examples</h2>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-zinc-200">Basic Usage</h3>
            <CodeBlock
              language="typescript"
              code={`import { useShortcut } from "@remcostoeten/use-shortcut"

export function App() {
  const hotkeys = useShortcut()

  // Simple modifier + key
  hotkeys.mod.key("s").on(save)

  // Multiple modifiers
  hotkeys.ctrl.shift.key("p").on(togglePalette)
}`}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-zinc-200">Inside Inputs (Exception Handling)</h3>
            <p className="text-sm text-zinc-400">
              By default, shortcuts are disabled in inputs. To enable them (e.g. for a global Save command),
              clear the exceptions with <code className="font-mono text-zinc-300">.except([])</code>.
            </p>
            <CodeBlock
              language="typescript"
              code={`// Enable inside inputs/textareas
hotkeys.mod.key("s")
  .except([]) 
  .on((e) => {
    e.preventDefault()
    save()
  })`}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-zinc-200">React State Integration</h3>
            <p className="text-sm text-zinc-400">
              Handlers have access to the latest state and props (no stale closures).
            </p>
            <CodeBlock
              language="typescript"
              code={`const [count, setCount] = useState(0)
const hotkeys = useShortcut()

hotkeys.key("arrowup").on(() => {
  // Safe to use current 'count' state
  setCount(count + 1)
})`}
            />
          </div>

        </section>

      </div>
    </main>
  )
}
