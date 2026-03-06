import { Suspense, useMemo } from "react";
import { getPackageBySlug } from "@/config/registry";
import { getDemoComponent } from "@/domains/registry";
import { PackageShowcase } from "@/components/showcase/PackageShowcase";

export default function Index() {
  const config = getPackageBySlug("use-shortcut");
  const DemoComponent = useMemo(() => getDemoComponent("use-shortcut"), []);

  if (!config) return null;

  return (
    <PackageShowcase
      config={config}
      canonicalPath="/"
      demoContent={
        DemoComponent ? (
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4 p-4 animate-pulse">
                <div className="h-8 w-1/3 rounded-md bg-muted" />
                <div className="h-[200px] w-full rounded-md bg-muted" />
                <div className="flex gap-2">
                  <div className="h-10 w-24 rounded-md bg-muted" />
                  <div className="h-10 w-24 rounded-md bg-muted" />
                </div>
              </div>
            }
          >
            <DemoComponent />
          </Suspense>
        ) : undefined
      }
    />
  );
}
