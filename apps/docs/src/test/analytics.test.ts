import { describe, expect, it } from "vitest";
import { validateIngestUrl } from "@remcostoeten/analytics";
import {
  ANALYTICS_INGEST_URL,
  analyticsIngestUrl,
  analyticsProjectId,
} from "@/lib/analytics";

describe("analytics config", () => {
  it("uses the production ingestion host only", () => {
    expect(analyticsIngestUrl).toBe("https://ingestion.remcostoeten.nl");
    expect(analyticsIngestUrl).toBe(ANALYTICS_INGEST_URL);
    expect(validateIngestUrl(analyticsIngestUrl)).toBe(true);
  });

  it("defaults project id for registry docs", () => {
    expect(analyticsProjectId).toBe("registry-docs");
  });
});

describe("analytics ingestion", () => {
  it("accepts SDK-shaped events at /e", async () => {
    const response = await fetch(`${ANALYTICS_INGEST_URL}/e`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "event",
        projectId: analyticsProjectId,
        path: "/vitest",
        referrer: null,
        origin: "https://registry.remcostoeten.nl",
        host: "registry.remcostoeten.nl",
        ua: "vitest",
        lang: "en-US",
        visitorId: "00000000-0000-4000-8000-000000000001",
        sessionId: "00000000-0000-4000-8000-000000000002",
        meta: {
          eventName: "analytics_config_verify",
          source: "docs-vitest",
        },
      }),
    });

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
