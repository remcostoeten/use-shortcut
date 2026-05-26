import { trackEvent, validateIngestUrl } from "@remcostoeten/analytics";

export const ANALYTICS_INGEST_URL = "https://ingestion.remcostoeten.nl";

export const analyticsProjectId =
  (import.meta.env.VITE_ANALYTICS_PROJECT_ID as string | undefined)
  || "registry-docs";

export const analyticsIngestUrl = ANALYTICS_INGEST_URL;

export const analyticsEnabled =
  import.meta.env.VITE_ANALYTICS_DISABLED !== "true";

if (!validateIngestUrl(analyticsIngestUrl)) {
  throw new Error(`Invalid analytics ingest URL: ${analyticsIngestUrl}`);
}

export function trackDocsEvent(
  eventName: string,
  meta?: Record<string, unknown>,
) {
  if (!analyticsEnabled) return;

  trackEvent(eventName, meta, {
    projectId: analyticsProjectId,
    ingestUrl: analyticsIngestUrl,
    debug: import.meta.env.DEV,
  });
}
