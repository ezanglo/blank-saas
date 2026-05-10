"use client";

import { useCallback } from "react";
import posthog from "posthog-js";

export function useAnalytics() {
  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    posthog.capture(event, properties);
  }, []);

  const identify = useCallback((userId: string, traits?: Record<string, unknown>) => {
    posthog.identify(userId, traits);
  }, []);

  const group = useCallback(
    (groupType: string, groupKey: string, properties?: Record<string, unknown>) => {
      posthog.group(groupType, groupKey, properties);
    },
    [],
  );

  return { track, identify, group };
}
