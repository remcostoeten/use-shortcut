import { getLatestRelease } from "@/lib/github"
import { LatestCommit } from "./latest-commit"
import Link from "next/link"

export async function Header() {
    const release = await getLatestRelease()

    return (
        <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md" role="banner">
            <div className="container mx-auto max-w-4xl px-4">
                <div className="flex items-center justify-between h-14">
                    <Link
                        href="/"
                        className="flex items-center hover:opacity-80 transition-opacity"
                        title="useShortcut - Home"
                        aria-label="useShortcut home"
                    >
                        <Logo />
                        <kbd className="text-zinc-400">useShortcut</kbd>
                    </Link>

                    <nav className="flex items-center gap-1 text-sm" aria-label="Site navigation">
                        <Link
                            href="https://github.com/remcostoeten/use-shortcut"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5 rounded-none hover:bg-zinc-800/50"
                            title="View source code on GitHub"
                            aria-label="GitHub repository"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <span className="hidden sm:inline">GitHub</span>
                        </Link>
                        <Link
                            href="https://www.npmjs.com/package/@remcostoeten/use-shortcut"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5 rounded-none hover:bg-zinc-800/50"
                            title="View package on npm registry"
                            aria-label="NPM package"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M1.763 0c-.966 0-1.763.797-1.763 1.763v20.474c0 .966.797 1.763 1.763 1.763h20.474c.966 0 1.763-.797 1.763-1.763v-20.474c0-.966-.797-1.763-1.763-1.763h-20.474zm14.072 6.551v10.899h-3.27v-8.174h-2.181v8.174h-8.174v-10.899h13.625zm2.724 0v10.899h2.725v-10.899h-2.725z" />
                            </svg>
                            <span className="hidden sm:inline">NPM</span>
                        </Link>

                        <div className="hidden sm:block h-4 w-px bg-zinc-700/50 mx-1" aria-hidden="true"></div>

                        <div className="hidden sm:block">
                            <LatestCommit />
                        </div>
                    </nav>

                    <div className="flex items-center">
                        {release ? (
                            <Link
                                href={release.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
                            >
                                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500"></span>
                                v{release.version}
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-mono text-zinc-500">
                                <span className="w-1.5 h-1.5 rounded-none bg-zinc-600"></span>
                                v1.0.0
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

function Logo() {
    return (
        <svg viewBox="0 0 1024 1024" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path d="m515 153h13l18 2 22 6 16 8 15 9v2l5 2 13 13 4 5 4 7 6 10 5 11 4 13 2 13v8l8 1 16 4 24 9 16 7 16 8 14 8 8 5v2l4 1v2l4 1v2l4 2 9 8 11 14 9 18 3 12v87l-3 15-7 16-3 6 5 5 6 13 2 11v79l-5 18-7 14 1 5 7 11 3 9 1 7v75l-3 16-6 15-10 15-6 7-5 5-10 9-19 13-22 12-23 10-33 11-32 8-37 6-27 3-16 1h-54l-35-3-35-5-32-7-16-5-27-9-21-9-19-10-18-12-11-9-15-15-7-10-8-16-4-15-1-6v-73l4-17 8-13 1-3-8-16-4-15-1-9v-71l4-16 5-10 3-4-1-4-7-16-3-11-1-10v-77l3-17 6-14 10-14 17-17 14-10 21-12 21-10 19-7 19-6 28-7 23-4 10-2 24-3 20-5 16-7 8-6 6-7 3-6v-11l-4-6-7-6-7-3-16-2-5-4-2-4v-8l6-7 16-8 10-3z" className="fill-[#737373] dark:fill-[#A3A3A3]"></path><path d="m505 175h29l16 3 17 6 12 7 10 8 10 10 10 15 6 14 4 18v24l8 1 26 6 35 12 23 11 16 10 10 8 6 5 9 11 6 10 4 13-1 85-3 12-6 11-7 9-9 9-13 10-22 13-23 10-25 9-36 9-28 5-36 4-14 1h-50l-36-3-28-4-29-6-26-7-23-8-18-8-21-11-14-10-13-12-7-8-7-12-3-10-1-91 5-13 7-10 9-10 14-11 15-9 16-8 25-10 27-8 32-7 40-6 23-6 17-7 14-9 10-10 6-10 3-8v-17l-5-12-7-8-8-5-7-2v-2z" className="fill-[#404040] dark:fill-[#525252]"></path><path d="m267 653 4 2 12 10 19 12 22 11 23 9 29 9 24 6 33 6 35 4 14 1h63l24-2 42-6 27-6 28-8 20-7 23-10 19-10 17-12 11-9 3 3 2 5v73l-3 14-7 14-11 13-13 11-19 12-22 11-27 10-27 8-34 7-28 4-21 2-20 1h-33l-41-3-28-4-29-6-26-7-20-7-23-10-20-11-13-9-15-13-9-12-5-10-3-10-1-77z" className="fill-[#525252] dark:fill-[#737373]"></path><path d="m267 510h2l5 5 10 8 13 8 16 9 23 10 36 12 28 7 28 5 31 4 27 2h54l28-2 42-6 36-8 35-11 24-10 25-13 17-12 9-8h2l3 7v74l-2 11-5 12-8 11-13 13-17 12-18 10-23 10-30 10-28 7-28 5-34 4-16 1h-50l-36-3-33-5-36-8-23-7-25-10-16-8-14-8-11-8-11-9-9-11-6-9-4-10-1-5-1-78z" className="fill-[#525252] dark:fill-[#737373]"></path><path d="m760 383h1v69l-3 12-6 11-7 9-9 9-13 10-22 13-23 10-25 9-36 9-28 5-36 4-14 1h-50l-36-3-28-4-29-6-26-7-23-8-18-8-21-11-14-10-13-12-7-8-7-12-3-10v-70l2 3 2 7h2l7 10 11 11 18 12 16 9 26 11 28 9 33 8 23 4 35 4 33 2h26l36-2 34-4 31-6 24-6 30-10 25-11 19-11 14-11 10-10 7-11z" className="fill-[#5C5C5C] dark:fill-[#858585]"></path><path d="m514 175h20l16 3 17 6 12 7 10 8 10 10 10 15 6 14 4 18v24l8 1 26 6 35 12 23 11 16 10 10 8 6 5 9 11 6 10 4 13v12l-4 12-6 10-9 10-11 10-14 9-16 9-26 11-32 10-31 7-32 5-34 3-21 1h-26l-33-2-35-4-28-5-35-9-29-10-24-11-18-11-12-9-12-12-4-6v-2h-2l-5-13v-18l5-13 7-10 9-10 14-11 15-9 16-8 25-10 27-8 32-7 33-5h9v2l-14 5-41 8-28 8-23 8-18 8-17 10-13 10-8 8-7 11-3 8-1 11 2 11 5 10 9 11 13 10 15 9 17 8 28 10 27 7 31 6 34 4 30 2h38l34-2 37-5 34-7 20-6 21-7 20-9 14-8 13-10 9-9 6-10 3-10v-12l-3-10-6-10-9-10-11-9-11-7-17-9-20-8-26-8-26-6-9-1-2-7-3-22-4-13h-3l-12-16-4-5-1-6v-3l-9-9-3-7-8-6-14-7-17-5-12-2z" className="fill-[#4A4A4A] dark:fill-[#D4D4D4]"></path><path d="m267 653 4 2 12 10 19 12 22 11 23 9 29 9 24 6 33 6 35 4 14 1h63l24-2 42-6 27-6 28-8 20-7 23-10 19-10 17-12 11-9 3 3 1 2v11l-8 11-10 10-14 10-15 9-22 10-16 6-31 9-31 7-35 5-36 3h-53l-30-2-38-5-34-7-29-8-20-7-25-11-14-8-13-9-10-9-8-8-5-9 1-7z" className="fill-[#4A4A4A] dark:fill-[#D4D4D4]"></path></svg>
    )
}