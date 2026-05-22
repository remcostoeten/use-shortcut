import * as React from "react";
import { cn } from "@/lib/utils";

interface ShowcaseSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function ShowcaseSection({ children, className, ...props }: ShowcaseSectionProps) {
    return (
        <div
            className={cn(
                "border-b border-border -mx-[1px] bg-card/60 px-5 py-10 sm:px-8 lg:px-10 flex flex-col gap-6",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
