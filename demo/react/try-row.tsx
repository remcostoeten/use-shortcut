import type { ReactNode } from "react"

type Props = {
    display: string
    description: string
    firedAt: number
    children?: ReactNode
}

export function TryRow(props: Props) {
    return (
        <li className="try-row">
            <span className="dot" key={props.firedAt} data-live={props.firedAt > 0} />
            <kbd className="keycap">{props.display}</kbd>
            <span className="try-text">{props.description}</span>
            {props.children !== undefined && <span className="try-extra">{props.children}</span>}
        </li>
    )
}
