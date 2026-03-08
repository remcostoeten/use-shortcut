'use client';

import { useState } from 'react';
import { Analytics, trackEvent, trackClick, trackPageView, trackError } from '@remcostoeten/analytics';

export default function AnalyticsDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [errorTriggered, setErrorTriggered] = useState(false);

  const handleTrackEvent = () => {
    trackEvent('demo_interaction', {
      component: 'analytics-demo',
      action: 'button_click',
      timestamp: Date.now()
    });
  };

  const handleTrackClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    trackClick('demo_button', {
      click_count: newCount,
      demo_type: 'analytics'
    });
  };

  const handleTrackError = () => {
    if (!errorTriggered) {
      setErrorTriggered(true);
      try {
        throw new Error('Demo error for analytics testing');
      } catch (error) {
        trackError(error as Error, {
          component: 'analytics-demo',
          user_action: 'trigger_error'
        });
      }
    }
  };

  const handlePageView = () => {
    trackPageView();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Analytics SDK Demo</h2>
        <p className="text-muted-foreground">
          This demo showcases the @remcostoeten/analytics SDK functionality.
          Open your browser's network tab to see the events being sent.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Event Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Track custom events with metadata
          </p>
          <button
            onClick={handleTrackEvent}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Track Custom Event
          </button>
        </div>

        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Click Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Track user interactions (clicks: {clickCount})
          </p>
          <button
            onClick={handleTrackClick}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            Track Click
          </button>
        </div>

        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Error Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Track errors with context
          </p>
          <button
            onClick={handleTrackError}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            disabled={errorTriggered}
          >
            {errorTriggered ? 'Error Tracked' : 'Trigger Error'}
          </button>
        </div>

        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Page View Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Manually trigger page view tracking
          </p>
          <button
            onClick={handlePageView}
            className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90"
          >
            Track Page View
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm font-mono">
          Note: This demo includes the Analytics component which automatically
          tracks page views. Check the network tab for POST requests to your ingest endpoint.
        </p>
      </div>

      <Analytics projectId="analytics-demo" />
    </div>
  );
}
