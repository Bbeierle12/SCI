import { db } from './schema';
import type { Event, EventType } from './schema';

/**
 * Event Operations
 */

/**
 * Create a new event
 * @param event - Event data (without id and createdAt)
 * @returns The created event with assigned ID
 */
export async function createEvent(
  event: Omit<Event, 'id' | 'createdAt'>
): Promise<Event> {
  const eventWithTimestamp: Event = {
    ...event,
    symbol: event.symbol.toUpperCase(),
    createdAt: Date.now()
  };

  const id = await db.events.add(eventWithTimestamp);
  return { ...eventWithTimestamp, id };
}

/**
 * Get an event by ID
 * @param id - Event ID
 * @returns The event or undefined if not found
 */
export async function getEvent(id: number): Promise<Event | undefined> {
  return await db.events.get(id);
}

/**
 * Get all events
 * @returns Array of all events sorted by timestamp (newest first)
 */
export async function getAllEvents(): Promise<Event[]> {
  return await db.events
    .orderBy('timestamp')
    .reverse()
    .toArray();
}

/**
 * Get events for a specific symbol
 * @param symbol - Stock symbol
 * @returns Array of events for the symbol
 */
export async function getEventsForSymbol(symbol: string): Promise<Event[]> {
  const upperSymbol = symbol.toUpperCase();

  return await db.events
    .where('symbol')
    .equals(upperSymbol)
    .reverse()
    .sortBy('timestamp');
}

/**
 * Get events by type
 * @param type - Event type
 * @returns Array of events of the specified type
 */
export async function getEventsByType(type: EventType): Promise<Event[]> {
  return await db.events
    .where('type')
    .equals(type)
    .reverse()
    .sortBy('timestamp');
}

/**
 * Get events for a symbol and type
 * @param symbol - Stock symbol
 * @param type - Event type
 * @returns Array of events matching both criteria
 */
export async function getEventsForSymbolAndType(
  symbol: string,
  type: EventType
): Promise<Event[]> {
  const upperSymbol = symbol.toUpperCase();

  const allSymbolEvents = await db.events
    .where('symbol')
    .equals(upperSymbol)
    .toArray();

  return allSymbolEvents
    .filter(event => event.type === type)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get events within a time range
 * @param from - Start timestamp (epoch milliseconds)
 * @param to - End timestamp (epoch milliseconds)
 * @returns Array of events in the time range
 */
export async function getEventsInRange(
  from: number,
  to: number
): Promise<Event[]> {
  return await db.events
    .where('timestamp')
    .between(from, to, true, true)
    .reverse()
    .sortBy('timestamp');
}

/**
 * Get events for a symbol within a time range
 * @param symbol - Stock symbol
 * @param from - Start timestamp (epoch milliseconds)
 * @param to - End timestamp (epoch milliseconds)
 * @returns Array of events
 */
export async function getEventsForSymbolInRange(
  symbol: string,
  from: number,
  to: number
): Promise<Event[]> {
  const upperSymbol = symbol.toUpperCase();

  const allSymbolEvents = await db.events
    .where('symbol')
    .equals(upperSymbol)
    .toArray();

  return allSymbolEvents
    .filter(event => event.timestamp >= from && event.timestamp <= to)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Update an event
 * @param id - Event ID
 * @param updates - Partial event data to update
 * @returns Number of updated records (1 if successful, 0 if not found)
 */
export async function updateEvent(
  id: number,
  updates: Partial<Omit<Event, 'id' | 'createdAt'>>
): Promise<number> {
  const updatesWithUpperSymbol = updates.symbol
    ? { ...updates, symbol: updates.symbol.toUpperCase() }
    : updates;

  return await db.events.update(id, updatesWithUpperSymbol);
}

/**
 * Delete an event
 * @param id - Event ID
 * @returns Number of deleted records (1 if successful, 0 if not found)
 */
export async function deleteEvent(id: number): Promise<number> {
  const deleted = await db.events.delete(id);
  return deleted ? 1 : 0;
}

/**
 * Delete all events for a symbol
 * @param symbol - Stock symbol
 * @returns Number of events deleted
 */
export async function deleteEventsForSymbol(symbol: string): Promise<number> {
  const upperSymbol = symbol.toUpperCase();

  return await db.events
    .where('symbol')
    .equals(upperSymbol)
    .delete();
}

/**
 * Delete events by type
 * @param type - Event type
 * @returns Number of events deleted
 */
export async function deleteEventsByType(type: EventType): Promise<number> {
  return await db.events
    .where('type')
    .equals(type)
    .delete();
}

/**
 * Delete events older than a specific timestamp
 * @param olderThan - Timestamp threshold (epoch milliseconds)
 * @returns Number of events deleted
 */
export async function clearOldEvents(olderThan: number): Promise<number> {
  return await db.events
    .where('timestamp')
    .below(olderThan)
    .delete();
}

/**
 * Get recent events with pagination
 * @param offset - Number of records to skip
 * @param limit - Maximum number of records to return
 * @returns Array of events
 */
export async function getEventsPaginated(
  offset: number,
  limit: number
): Promise<Event[]> {
  return await db.events
    .orderBy('timestamp')
    .reverse()
    .offset(offset)
    .limit(limit)
    .toArray();
}

/**
 * Get upcoming events (future timestamps)
 * @param limit - Maximum number of events to return
 * @returns Array of upcoming events
 */
export async function getUpcomingEvents(limit: number = 10): Promise<Event[]> {
  const now = Date.now();

  return await db.events
    .where('timestamp')
    .above(now)
    .limit(limit)
    .sortBy('timestamp');
}

/**
 * Get the most recent event for a symbol
 * @param symbol - Stock symbol
 * @returns The most recent event or undefined
 */
export async function getLatestEventForSymbol(
  symbol: string
): Promise<Event | undefined> {
  const events = await getEventsForSymbol(symbol);
  return events[0];
}

/**
 * Get event statistics
 * @returns Object with event statistics
 */
export async function getEventStats(): Promise<{
  total: number;
  byType: Record<EventType, number>;
  bySymbol: Record<string, number>;
  earliestTimestamp: number | null;
  latestTimestamp: number | null;
}> {
  const allEvents = await db.events.toArray();

  const stats = {
    total: allEvents.length,
    byType: {} as Record<EventType, number>,
    bySymbol: {} as Record<string, number>,
    earliestTimestamp: null as number | null,
    latestTimestamp: null as number | null
  };

  if (allEvents.length > 0) {
    const timestamps = allEvents.map(e => e.timestamp);
    stats.earliestTimestamp = Math.min(...timestamps);
    stats.latestTimestamp = Math.max(...timestamps);

    allEvents.forEach(event => {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

      // Count by symbol
      stats.bySymbol[event.symbol] = (stats.bySymbol[event.symbol] || 0) + 1;
    });
  }

  return stats;
}

/**
 * Get all unique symbols that have events
 * @returns Array of unique symbol strings
 */
export async function getSymbolsWithEvents(): Promise<string[]> {
  const allEvents = await db.events.toArray();
  const symbolSet = new Set(allEvents.map(e => e.symbol));
  return Array.from(symbolSet).sort();
}

/**
 * Bulk create multiple events
 * @param events - Array of events to create
 * @returns Array of created events with assigned IDs
 */
export async function bulkCreateEvents(
  events: Omit<Event, 'id' | 'createdAt'>[]
): Promise<Event[]> {
  const now = Date.now();
  const eventsWithTimestamps = events.map(event => ({
    ...event,
    symbol: event.symbol.toUpperCase(),
    createdAt: now
  }));

  const ids = await db.events.bulkAdd(eventsWithTimestamps, { allKeys: true });

  return eventsWithTimestamps.map((event, index) => ({
    ...event,
    id: ids[index] as number
  }));
}

/**
 * Check if an event exists for a symbol at a specific timestamp
 * @param symbol - Stock symbol
 * @param timestamp - Event timestamp
 * @param type - Event type (optional)
 * @returns True if event exists, false otherwise
 */
export async function hasEventAt(
  symbol: string,
  timestamp: number,
  type?: EventType
): Promise<boolean> {
  const upperSymbol = symbol.toUpperCase();

  const events = await db.events
    .where('symbol')
    .equals(upperSymbol)
    .toArray();

  const matchingEvents = events.filter(event => {
    const timestampMatch = event.timestamp === timestamp;
    const typeMatch = type ? event.type === type : true;
    return timestampMatch && typeMatch;
  });

  return matchingEvents.length > 0;
}

/**
 * Get events count by type for a symbol
 * @param symbol - Stock symbol
 * @returns Object with counts by event type
 */
export async function getEventCountsByType(
  symbol: string
): Promise<Record<EventType, number>> {
  const events = await getEventsForSymbol(symbol);

  const counts = {} as Record<EventType, number>;

  events.forEach(event => {
    counts[event.type] = (counts[event.type] || 0) + 1;
  });

  return counts;
}

/**
 * Clear all events
 * WARNING: This will delete all event history
 * @returns Number of events deleted
 */
export async function clearAllEvents(): Promise<number> {
  return await db.events.clear();
}
