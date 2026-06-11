import { trackEvent } from '@low/google/analytics'

export interface AnalyticsRepo {
  track(event: string, params?: Record<string, unknown>): void
}

export const datAnalytics: AnalyticsRepo = {
  track: (event, params) => trackEvent(event, params),
}
