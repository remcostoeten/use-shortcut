import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { applySeoMeta } from "@/lib/seo";
import {
  DOCS_MODE,
  getLabPath,
  getPackagePath,
  PRIMARY_PACKAGE_SLUG,
} from "@/config/site";
import { ShortcutLabApp } from "@/lab/ShortcutLabApp";
import "@/lab/styles.css";

export default function ShortcutLabPage() {
  const { slug } = useParams<{ slug?: string }>();
  const packageSlug = DOCS_MODE === "package" ? PRIMARY_PACKAGE_SLUG : slug;
  const docsPath = packageSlug ? getPackagePath(packageSlug) : "/";

  useEffect(() => {
    applySeoMeta({
      title: "Shortcut Lab | use-shortcut",
      description:
        "Interactive playground for @remcostoeten/use-shortcut — editor scopes, debug telemetry, chaining, groups, and command palette demos.",
      path: getLabPath("use-shortcut"),
    });
  }, []);

  if (DOCS_MODE !== "package" && slug !== "use-shortcut") {
    return <Navigate to="/" replace />;
  }

  return <ShortcutLabApp docsPath={docsPath} />;
}
