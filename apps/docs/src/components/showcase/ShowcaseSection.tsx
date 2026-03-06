import * as React from "react";
import { cn } from "@/lib/utils";

interface ShowcaseSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function ShowcaseSection({ children, className, ...props }: ShowcaseSectionProps) {
    return (
        <div
            className={cn(
                "border-b border-dashed border-border -mx-[1px] bg-card/30 px-4 py-8 sm:px-8 flex flex-col gap-6",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
