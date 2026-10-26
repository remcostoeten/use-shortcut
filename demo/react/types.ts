export type LogEntry = {
    id: number
    at: string
    text: string
}

export type Log = (text: string) => void
