import { trackEvent } from "@remcostoeten/analytics";

export const analyticsProjectId =
  (import.meta.env.VITE_ANALYTICS_PROJECT_ID as string | undefined)
  || "registry-docs";

export const analyticsIngestUrl = import.meta.env.VITE_REMCO_ANALYTICS_URL as
  | string
  | undefined;

export const analyticsEnabled = Boolean(analyticsIngestUrl);

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
