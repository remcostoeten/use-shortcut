import { ReactNode } from "react";

interface DemoSectionProps {
  label?: string;
  children?: ReactNode;
}

export function DemoSection({ children }: DemoSectionProps) {
  return (
    <div className="w-full">
      {children || (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="type something..."
            className="w-full border border-border bg-card px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}
