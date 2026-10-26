import { useShortcutList } from "./shortcuts"

type Props = {
    title: string
}

export function BindingList(props: Props) {
    const bindings = useShortcutList()
    return (
        <section className="panel">
            <h2>
                {props.title} <span className="count">{bindings.length}</span>
            </h2>
            <ul className="bindings">
                {bindings.map((binding) => (
                    <li key={binding.id} data-enabled={binding.enabled}>
                        <kbd className="keycap">{binding.display}</kbd>
                        <span>
                            {binding.description === "" ? binding.combo : binding.description}
                        </span>
                        {binding.scopes.length > 0 && (
                            <span className="scope">{binding.scopes.join(", ")}</span>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    )
}
