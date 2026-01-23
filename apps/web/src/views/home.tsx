import { Header } from "@/components/header"
import { ShortcutPlayground } from "@/components/shortcut-playground"
import { CodeBlock } from "@/shared/components/code-block/code-block"
import { CopyLlmInstructions } from "@/shared/components/copy-llm-instructions"
import { Footer } from "@/components/footer"
import { ApiReference } from "@/components/api-reference"
export default function HomeView() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-zinc-950 text-zinc-100">
                <section className="relative mx-auto container mx-auto max-w-4xl ">
                    <div className="container mx-auto space-y-2 px-4 pt-16 pb-12">
                        <h2 className="text-2xl font-semibold text-zinc-100"><pre>Elegant.kbd.docs()</pre></h2>
                        <p className="text-lg text-zinc-400">
                            Build complex keyboard shortcuts with a fluent, chainable API.
                            Press the keys below to see it work.
                        </p>
                        <div className="flex flex-col gap-2 w-fit">
                            <CodeBlock
                                disableTopBar
                                showBottomFade={false}
                                language="shell"
                                code="bun add @remcostoeten/use-shortcut"
                            />
                            <p className="text-sm text-zinc-500">
                                Also works with <code className="text-zinc-400">pnpm</code>, <code className="text-zinc-400">npm</code>, or <code className="text-zinc-400">yarn</code>, althrough I sincerely hope you don't use the last two in 2026.
                            </p>
                        </div>
                    </div>

                    <ShortcutPlayground />

                    <div className="mt-8 flex justify-center">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-900 border border-zinc-800">
                            <span className="flex items-center gap-2 text-sm text-zinc-400">
                                <span className="w-2 h-2 bg-emerald-500" />
                                Live — shortcuts are active on this page
                            </span>
                        </div>
                    </div>
                </section>


                <section className="border-t border-zinc-800 bg-zinc-950">
                    <div className="container mx-auto max-w-4xl px-4 py-16 space-y-16">

                        <ApiReference />

                        <div className="space-y-6">

                            <div className="mt-8">
                                <CodeBlock
                                    showBottomFade={false}
                                    language="tsx"
                                    code={`const $ = useShortcut()

$.mod.key("s").on(save)           // ⌘S / Ctrl+S
$.mod.key("k").on(openSearch)     // ⌘K / Ctrl+K  
$.ctrl.shift.key("p").on(palette) // Ctrl+Shift+P`}
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-zinc-100">LLM Context</h2>
                            <p className="text-zinc-400">
                                Give your AI coding assistant full context about this package. Copy the spec to your rules file.
                            </p>
                            <CopyLlmInstructions />
                        </div>


                    </div>
                </section>
                <Footer />
            </main >
        </>
    )
}