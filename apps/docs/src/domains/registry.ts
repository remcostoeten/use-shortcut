import { lazy, type ComponentType } from "react";

type DemoRegistry = Record<string, () => Promise<{ default: ComponentType }>>;

const demoModules: DemoRegistry = {
    "use-shortcut": () =>
        import("@/domains/use-shortcut/demo").then((m) => ({
            default: m.UseShortcutDemo,
        })),
    "analytics": () =>
        import("@/domains/analytics/demo").then((m) => ({
            default: m.default,
        })),
};

export function getDemoComponent(slug: string) {
    const loader = demoModules[slug];
    if (!loader) return null;
    return lazy(loader);
}
