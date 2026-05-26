'use client';

import { useMemo, useState } from 'react';
import { Activity, BarChart3, MousePointerClick, Rocket } from 'lucide-react';
import { Analytics, trackEvent } from '@remcostoeten/analytics';

type DemoEvent = {
  name: string;
  detail: string;
  count: number;
};

const initialEvents: DemoEvent[] = [
  { name: 'page_view', detail: 'landing /docs/analytics', count: 1 },
  { name: 'cta_click', detail: 'hero install button', count: 12 },
  { name: 'signup_started', detail: 'pricing / starter plan', count: 4 },
];

export default function AnalyticsDemo() {
  const [events, setEvents] = useState<DemoEvent[]>(initialEvents);
  const [lastEvent, setLastEvent] = useState<string>('page_view');

  const panelClassName =
    'border border-border/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';
  const labelClassName =
    'font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/72';
  const bodyCopyClassName =
    'mt-2 text-[13px] lowercase leading-6 text-foreground/78';

  const totalEvents = useMemo(
    () => events.reduce((sum, event) => sum + event.count, 0),
    [events],
  );

  const pushEvent = (name: string, detail: string) => {
    setLastEvent(name);
    setEvents((current) => {
      const existing = current.find((event) => event.name === name && event.detail === detail);

      if (existing) {
        return current.map((event) =>
          event.name === name && event.detail === detail
            ? { ...event, count: event.count + 1 }
            : event,
        );
      }

      return [{ name, detail, count: 1 }, ...current].slice(0, 5);
    });

    trackEvent(name, {
      source: 'docs-demo',
      detail,
    });
  };

  return (
    <div className="overflow-hidden border border-border bg-[radial-gradient(circle_at_top_right,rgba(255,98,0,0.2),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <div className="border-b border-dashed border-border px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg">
            <p className="font-mono text-xs text-primary">[live signal demo]</p>
            <p className="mt-1 max-w-md text-[15px] lowercase leading-7 text-foreground">
              See how pageviews and product events can be tracked without dropping a full analytics dashboard into your app.
            </p>
            <p className="mt-2 max-w-md text-[13px] lowercase leading-6 text-foreground/72">
              Tap the actions to simulate real product events. In production these post to your ingest endpoint.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-left sm:min-w-[280px]">
            <div className={`${panelClassName} px-3 py-2.5`}>
              <p className={labelClassName}>events</p>
              <p className="mt-1 text-lg text-foreground">{totalEvents}</p>
            </div>
            <div className={`${panelClassName} px-3 py-2.5`}>
              <p className={labelClassName}>last</p>
              <p className="mt-1 truncate text-sm lowercase text-foreground">{lastEvent}</p>
            </div>
            <div className={`${panelClassName} px-3 py-2.5`}>
              <p className={labelClassName}>transport</p>
              <p className="mt-1 text-sm lowercase text-foreground">post</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-dashed border-border px-4 py-4 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={`${panelClassName} px-3 py-3`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">1. add the sdk</p>
            <p className={bodyCopyClassName}>
              Install <code className="font-mono text-[11px] text-foreground">@remcostoeten/analytics</code>, render <code className="font-mono text-[11px] text-foreground">&lt;Analytics /&gt;</code> once, and use <code className="font-mono text-[11px] text-foreground">trackEvent(...)</code> for product events.
            </p>
          </div>
          <div className={`${panelClassName} px-3 py-3`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">2. host ingestion</p>
            <p className={bodyCopyClassName}>
              Point <code className="font-mono text-[11px] text-foreground">VITE_ANALYTICS_URL</code> or <code className="font-mono text-[11px] text-foreground">NEXT_PUBLIC_ANALYTICS_URL</code> at your ingestion service, for example <code className="font-mono text-[11px] text-foreground">https://ingestion.remcostoeten.nl</code> exposing <code className="font-mono text-[11px] text-foreground">POST /e</code>.
            </p>
          </div>
          <div className={`${panelClassName} px-3 py-3`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">3. store and query</p>
            <p className={bodyCopyClassName}>
              The ingestion service validates, enriches, dedupes, and writes events into Postgres so your dashboard can query them later.
            </p>
          </div>
        </div>

        <div className="mt-3 border border-border/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] px-3 py-3">
          <p className={labelClassName}>actual flow in the repo</p>
          <div className="mt-2 space-y-2 text-[13px] lowercase leading-6 text-foreground/78">
            <p>
              In the SDK, <code className="font-mono text-[11px] text-foreground">&lt;Analytics /&gt;</code> triggers <code className="font-mono text-[11px] text-foreground">trackPageView(...)</code>, and manual calls like <code className="font-mono text-[11px] text-foreground">trackEvent(...)</code> build a browser payload with project id, path, referrer, user agent, visitor id, and session id.
            </p>
            <p>
              That payload is sent with <code className="font-mono text-[11px] text-foreground">navigator.sendBeacon</code>, with <code className="font-mono text-[11px] text-foreground">fetch(..., &#123; keepalive: true &#125;)</code> as fallback, to <code className="font-mono text-[11px] text-foreground">/e</code> on your ingestion host.
            </p>
            <p>
              The ingestion app validates, hashes the IP, detects bots, extracts geo headers, deduplicates the event, and then inserts the row into <code className="font-mono text-[11px] text-foreground">events</code> in Postgres.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="https://github.com/remcostoeten/analytics/blob/master/packages/sdk/src/track.ts"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center border border-border bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary transition-colors hover:border-primary/40 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                sdk track.ts
              </a>
              <a
                href="https://github.com/remcostoeten/analytics/blob/master/packages/sdk/src/analytics.tsx"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center border border-border bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary transition-colors hover:border-primary/40 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                analytics.tsx
              </a>
              <a
                href="https://github.com/remcostoeten/analytics/blob/master/apps/ingestion/src/ingest.ts"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center border border-border bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary transition-colors hover:border-primary/40 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                ingest handler
              </a>
              <a
                href="https://github.com/remcostoeten/analytics/blob/master/packages/db/src/schema.ts"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center border border-border bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary transition-colors hover:border-primary/40 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                db schema
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-dashed border-border p-4 sm:border-b-0 sm:border-r sm:p-5">
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => pushEvent('signup_started', 'pricing / starter plan')}
              className="group flex min-h-14 items-center justify-between gap-3 border border-border/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-4 text-left transition-colors hover:border-primary/40 hover:bg-background/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex items-center gap-3">
                <Rocket className="h-4 w-4 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm lowercase text-foreground">track signup intent</p>
                  <p className="text-[13px] lowercase text-foreground/72">pricing click with plan metadata</p>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65">event</span>
            </button>

            <button
              type="button"
              onClick={() => pushEvent('cta_click', 'docs / install button')}
              className="group flex min-h-14 items-center justify-between gap-3 border border-border/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-4 text-left transition-colors hover:border-primary/40 hover:bg-background/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex items-center gap-3">
                <MousePointerClick className="h-4 w-4 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm lowercase text-foreground">track primary cta click</p>
                  <p className="text-[13px] lowercase text-foreground/72">docs conversion event</p>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65">event</span>
            </button>

            <button
              type="button"
              onClick={() => pushEvent('report_viewed', 'dashboard / weekly trend')}
              className="group flex min-h-14 items-center justify-between gap-3 border border-border/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-4 text-left transition-colors hover:border-primary/40 hover:bg-background/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm lowercase text-foreground">track report view</p>
                  <p className="text-[13px] lowercase text-foreground/72">screen-level analytics event</p>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65">event</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="border border-border/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))]">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/80">event stream</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65">live</span>
            </div>

            <div className="divide-y divide-border/70">
              {events.map((event) => (
                <div key={`${event.name}-${event.detail}`} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] lowercase text-primary">{event.name}</p>
                    <p className="mt-1 text-[13px] lowercase leading-6 text-foreground/74">
                      {event.detail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={labelClassName}>count</p>
                    <p className="mt-1 text-sm text-foreground">{event.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Analytics projectId="analytics-demo" />
    </div>
  );
}
