import type {
    CSSProperties,
    KeyboardEvent as ReactKeyboardEvent,
    ReactElement,
    ReactNode,
} from "react"

type Props = {
    disabled?: boolean
    children: ReactNode
}

const CONTENTS: CSSProperties = { display: "contents" }

/**
 * @name ShortcutBoundary
 * @description Keeps keydowns inside it from reaching the surrounding provider while `disabled` is
 * true, so shortcuts pause in one part of the tree. Keyups always pass so a hold started elsewhere
 * can still release. While `disabled` is false the boundary is transparent.
 *
 * @example
 * <ShortcutBoundary disabled={isEditing}>
 *     <Editor />
 * </ShortcutBoundary>
 */
export function ShortcutBoundary(props: Props): ReactElement {
    function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
        if (props.disabled) event.stopPropagation()
    }

    return (
        <div style={CONTENTS} onKeyDown={onKeyDown}>
            {props.children}
        </div>
    )
}
