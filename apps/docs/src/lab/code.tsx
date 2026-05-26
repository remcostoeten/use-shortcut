import { Highlight, type PrismTheme } from "prism-react-renderer";

const codeTheme: PrismTheme = {
  plain: { color: "var(--foreground)", backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "var(--token-comment)", fontStyle: "italic" } },
    { types: ["keyword", "builtin", "important", "atrule"], style: { color: "var(--token-keyword)" } },
    { types: ["string", "char", "template-string"], style: { color: "var(--token-string)" } },
    { types: ["number", "boolean", "null", "undefined"], style: { color: "var(--token-number)" } },
    { types: ["operator"], style: { color: "var(--token-operator)" } },
    { types: ["punctuation"], style: { color: "var(--token-punctuation)" } },
    { types: ["function"], style: { color: "var(--token-function)" } },
    { types: ["class-name", "type-annotation"], style: { color: "var(--token-type)" } },
    { types: ["property-access"], style: { color: "var(--token-property)" } },
    { types: ["parameter"], style: { color: "var(--token-parameter)" } },
    { types: ["arrow"], style: { color: "var(--token-operator)" } },
  ],
};

export function prose(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="inline-code">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

export function Code({ code }: { code: string }) {
  return (
    <Highlight theme={codeTheme} code={code.trimStart().replace(/\n$/, "")} language="typescript">
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="code-block">
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
