import { Suspense, useEffect, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { getPackageBySlug } from "@/config/registry";
import { DOCS_MODE, getPackageDocsUrl, isCurrentSiteUrl, PRIMARY_PACKAGE_SLUG, SITE_URL } from "@/config/site";
import { getDemoComponent } from "@/domains/registry";
import { PackageShowcase } from "@/components/showcase/PackageShowcase";

type PackagePageProps = {
  forcedSlug?: string;
};

export default function PackagePage({ forcedSlug }: PackagePageProps) {
  const { slug } = useParams<{ slug: string }>();
  const resolvedSlug = forcedSlug ?? slug;
  const config = resolvedSlug ? getPackageBySlug(resolvedSlug) : undefined;
  const DemoComponent = useMemo(
    () => (resolvedSlug ? getDemoComponent(resolvedSlug) : null),
    [resolvedSlug],
  );
  const docsUrl = resolvedSlug ? getPackageDocsUrl(resolvedSlug) : SITE_URL;
  const shouldRedirect = Boolean(
    resolvedSlug
      && docsUrl !== SITE_URL
      && ((DOCS_MODE === "package" && resolvedSlug !== PRIMARY_PACKAGE_SLUG)
        || !isCurrentSiteUrl(docsUrl)),
  );

  useEffect(() => {
    if (!shouldRedirect) return;
    window.location.replace(docsUrl);
  }, [docsUrl, shouldRedirect]);

  if (!config) {
    return <Navigate to="/" replace />;
  }

  if (shouldRedirect) {
    return null;
  }

  return (
    <PackageShowcase
      config={config}
      demoContent={
        DemoComponent ? (
          <Suspense
            fallback={
              <div className="animate-pulse flex w-full flex-col gap-4 p-4">
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
