import { getLatestCommit } from "@/lib/github"
import Link from "next/link"

export async function Footer() {
    const commit = await getLatestCommit()

    return (
        <footer className="border-t border-zinc-900 bg-zinc-950 py-12">
            <div className="container mx-auto max-w-5xl px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-500">
                <div className="flex flex-col">
                    <div className="flex flex-col">
                        <span>Built by</span>
                        <Link
                            href="https://github.com/remcostoeten"
                            target="_blank"
                            className="font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
                        >
                            Remco Stoeten
                        </Link>
                    </div>
                    <Link
                        href="https://remcostoeten-nl.vercel.app"
                        target="_blank"
                        className="font-xs text-zinc-300 hover:text-zinc-100 transition-colors"
                    >
                        remcostoeten.com
                    </Link>

                </div>

                <div className="flex items-center gap-6">
                    {commit && (
                        <Link
                            href={commit.url}
                            target="_blank"
                            title={commit.message}
                            className="flex flex-col text-right center font-mono text-xs hover:text-zinc-300 transition-colors"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/50"></span>
                            {commit.sha}
                            <span className="text-zinc-400">{commit.message.slice(0, 30)}</span>
                        </Link>
                    )}

                </div>
            </div>
        </footer>
    )
}
