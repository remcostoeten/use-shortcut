'use client';

import { useState } from 'react';
import { Analytics, trackEvent } from '@remcostoeten/analytics';

export default function AnalyticsDemo() {
  const [clickCount, setClickCount] = useState(0);

  const handleTrackEvent = () => {
    trackEvent('demo_interaction', {
      component: 'analytics-demo',
      action: 'button_click',
    });
  };

  const handleTrackClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    trackEvent('demo_button_clicked', {
      click_count: newCount,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Analytics Demo</h2>
        <p className="text-muted-foreground">
          This shows the Analytics component working. Open network tab to see events.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Custom Event</h3>
          <p className="text-sm text-muted-foreground">
            Track a custom event with metadata
          </p>
          <button
            onClick={handleTrackEvent}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Track Event
          </button>
        </div>

        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Click Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Track button clicks (count: {clickCount})
          </p>
          <button
            onClick={handleTrackClick}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            Track Click
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm font-mono">
          The Analytics component below automatically tracks page views.
          Check network tab for POST requests to your ingest endpoint.
        </p>
      </div>

      <Analytics projectId="analytics-demo" />
    </div>
  );
}
