import { useCallback } from 'react';
import api from './api';

export const useTelemetry = () => {
  const trackInteraction = useCallback(async (
    userId: string, 
    eventType: 'Like' | 'Save' | 'Search', 
    socialSource: string, 
    tag: string
  ) => {
    try {
      await api.post('/bridge/telemetry', {
        user_id: userId,
        event_type: eventType,
        social_source: socialSource,
        tag: tag
      });
      console.log(`Telemetry logged: ${eventType} on ${tag}`);
    } catch (error) {
      console.error('Failed to log telemetry:', error);
    }
  }, []);

  return { trackInteraction };
};
