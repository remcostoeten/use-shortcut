interface ApiProp {
  name: string;
  type: string;
  default?: string;
  description: string;
}

interface ApiTableProps {
  title?: string;
  props?: ApiProp[];
}

const defaultProps: ApiProp[] = [
  { name: "option", type: "string", default: '""', description: "placeholder option description." },
  { name: "enabled", type: "boolean", default: "true", description: "whether the feature is enabled." },
  { name: "delay", type: "number", default: "0", description: "delay in ms before action triggers." },
  { name: "callback", type: "(value: T) => void", default: "—", description: "callback on completion." },
  { name: "target", type: "HTMLElement | null", default: "document", description: "dom element to attach to." },
];

export function ApiTable({ title = "props", props = defaultProps }: ApiTableProps) {
  return (
    <div className="w-full">
      <h2 className="font-display text-base font-bold lowercase tracking-tight text-foreground mb-4">
        {title}
      </h2>

      <div className="overflow-hidden border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-3 py-2.5 font-mono text-xs font-medium lowercase text-muted-foreground">name</th>
              <th className="px-3 py-2.5 font-mono text-xs font-medium lowercase text-muted-foreground">type</th>
              <th className="hidden px-3 py-2.5 font-mono text-xs font-medium lowercase text-muted-foreground sm:table-cell">default</th>
              <th className="px-3 py-2.5 font-mono text-xs font-medium lowercase text-muted-foreground">description</th>
            </tr>
          </thead>
          <tbody>
            {props.map((p, i) => (
              <tr key={p.name} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-mono text-xs font-semibold text-primary">{p.name}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground break-words [overflow-wrap:anywhere]">{p.type}</td>
                <td className="hidden px-3 py-2.5 font-mono text-xs text-muted-foreground sm:table-cell">{p.default || "—"}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
