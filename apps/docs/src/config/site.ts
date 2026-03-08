const DEFAULT_SITE_URL = "https://use-shortcut.vercel.app";
const PACKAGE_DOCS_PATH = "/use-shortcut";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
export const PACKAGE_DOCS_URL = `${SITE_URL}${PACKAGE_DOCS_PATH}`;
export const PACKAGE_OG_IMAGE_URL = `${SITE_URL}/og-image.svg`;
export const PACKAGE_REPO_URL = "https://github.com/remcostoeten/use-shortcut";
