import { Suspense, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { getPackageBySlug } from "@/config/registry";
import { getDemoComponent } from "@/domains/registry";
import { PackageShowcase } from "@/components/showcase/PackageShowcase";

export default function PackagePage() {
    const { slug } = useParams<{ slug: string }>();
    const config = slug ? getPackageBySlug(slug) : undefined;
    const DemoComponent = useMemo(
        () => (slug ? getDemoComponent(slug) : null),
        [slug]
    );

    if (!config) return <Navigate to="/" replace />;

    return (
        <PackageShowcase
            config={config}
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
