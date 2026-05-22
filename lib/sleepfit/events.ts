import type { SleepfitEventRequest } from "@/lib/sleepfit/schemas";

interface StoredSleepfitEvent extends SleepfitEventRequest {
  id: string;
  receivedAt: string;
}

const eventStore: StoredSleepfitEvent[] = [];
const MAX_EVENTS = 5_000;

function createEventId() {
  return `sfe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function recordSleepfitEvent(event: SleepfitEventRequest) {
  const stored: StoredSleepfitEvent = {
    ...event,
    id: createEventId(),
    receivedAt: new Date().toISOString(),
  };

  eventStore.push(stored);
  if (eventStore.length > MAX_EVENTS) eventStore.splice(0, eventStore.length - MAX_EVENTS);

  return {
    eventId: stored.id,
    stored: true,
  };
}

export function getSleepfitEventSummary(mallId: string) {
  const events = eventStore.filter((event) => event.mallId === mallId);
  const byName = events.reduce<Record<string, number>>((summary, event) => {
    summary[event.eventName] = (summary[event.eventName] || 0) + 1;
    return summary;
  }, {});

  return {
    total: events.length,
    byName,
    lastEventAt: events.at(-1)?.receivedAt || null,
  };
}
