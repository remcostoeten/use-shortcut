import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { applySeoMeta } from "@/lib/seo";
import { REGISTRY_TITLE } from "@/config/site";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    applySeoMeta({
      title: `404 | ${REGISTRY_TITLE}`,
      description: "The page you requested could not be found.",
      path: location.pathname,
      noIndex: true,
    });
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Page not found.</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Back to registry
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
