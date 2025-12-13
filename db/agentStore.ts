import { db } from './schema';
import type { AgentRun, AgentType, AgentRunStatus } from './schema';

/**
 * Agent Run Operations
 */

/**
 * Create a new agent run
 * @param agentRun - Agent run data (without id and timestamps)
 * @returns The created agent run with assigned ID
 */
export async function createAgentRun(
  agentRun: Omit<AgentRun, 'id' | 'startedAt' | 'completedAt'>
): Promise<AgentRun> {
  const run: AgentRun = {
    ...agentRun,
    startedAt: Date.now(),
    status: agentRun.status || 'pending'
  };

  const id = await db.agentRuns.add(run);
  return { ...run, id };
}

/**
 * Get an agent run by ID
 * @param id - Agent run ID
 * @returns The agent run or undefined if not found
 */
export async function getAgentRun(id: number): Promise<AgentRun | undefined> {
  return await db.agentRuns.get(id);
}

/**
 * Get all agent runs
 * @returns Array of all agent runs sorted by start time (newest first)
 */
export async function getAllAgentRuns(): Promise<AgentRun[]> {
  return await db.agentRuns
    .orderBy('startedAt')
    .reverse()
    .toArray();
}

/**
 * Get agent runs by type
 * @param agentType - Type of agent
 * @returns Array of agent runs of the specified type
 */
export async function getAgentRunsByType(agentType: AgentType): Promise<AgentRun[]> {
  return await db.agentRuns
    .where('agentType')
    .equals(agentType)
    .reverse()
    .sortBy('startedAt');
}

/**
 * Get agent runs by status
 * @param status - Run status
 * @returns Array of agent runs with the specified status
 */
export async function getAgentRunsByStatus(status: AgentRunStatus): Promise<AgentRun[]> {
  return await db.agentRuns
    .where('status')
    .equals(status)
    .reverse()
    .sortBy('startedAt');
}

/**
 * Update an agent run
 * @param id - Agent run ID
 * @param updates - Partial agent run data to update
 * @returns Number of updated records (1 if successful, 0 if not found)
 */
export async function updateAgentRun(
  id: number,
  updates: Partial<Omit<AgentRun, 'id' | 'startedAt'>>
): Promise<number> {
  return await db.agentRuns.update(id, updates);
}

/**
 * Complete an agent run with success
 * @param id - Agent run ID
 * @param output - Output data from the agent
 * @returns Number of updated records
 */
export async function completeAgentRun(
  id: number,
  output: Record<string, unknown>
): Promise<number> {
  return await db.agentRuns.update(id, {
    status: 'completed',
    completedAt: Date.now(),
    output
  });
}

/**
 * Fail an agent run
 * @param id - Agent run ID
 * @param error - Error message
 * @returns Number of updated records
 */
export async function failAgentRun(id: number, error: string): Promise<number> {
  return await db.agentRuns.update(id, {
    status: 'failed',
    completedAt: Date.now(),
    error
  });
}

/**
 * Cancel an agent run
 * @param id - Agent run ID
 * @returns Number of updated records
 */
export async function cancelAgentRun(id: number): Promise<number> {
  return await db.agentRuns.update(id, {
    status: 'cancelled',
    completedAt: Date.now()
  });
}

/**
 * Start an agent run (update status to running)
 * @param id - Agent run ID
 * @returns Number of updated records
 */
export async function startAgentRun(id: number): Promise<number> {
  return await db.agentRuns.update(id, {
    status: 'running'
  });
}

/**
 * Delete an agent run
 * @param id - Agent run ID
 * @returns Number of deleted records (1 if successful, 0 if not found)
 */
export async function deleteAgentRun(id: number): Promise<number> {
  const deleted = await db.agentRuns.delete(id);
  return deleted ? 1 : 0;
}

/**
 * Get recent agent runs with pagination
 * @param offset - Number of records to skip
 * @param limit - Maximum number of records to return
 * @returns Array of agent runs
 */
export async function getAgentRunsPaginated(
  offset: number,
  limit: number
): Promise<AgentRun[]> {
  return await db.agentRuns
    .orderBy('startedAt')
    .reverse()
    .offset(offset)
    .limit(limit)
    .toArray();
}

/**
 * Get agent runs within a time range
 * @param from - Start timestamp (epoch milliseconds)
 * @param to - End timestamp (epoch milliseconds)
 * @returns Array of agent runs in the time range
 */
export async function getAgentRunsInRange(
  from: number,
  to: number
): Promise<AgentRun[]> {
  return await db.agentRuns
    .where('startedAt')
    .between(from, to, true, true)
    .reverse()
    .sortBy('startedAt');
}

/**
 * Get statistics about agent runs
 * @returns Object with run statistics
 */
export async function getAgentRunStats(): Promise<{
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  byType: Record<AgentType, number>;
}> {
  const allRuns = await db.agentRuns.toArray();

  const stats = {
    total: allRuns.length,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    byType: {} as Record<AgentType, number>
  };

  allRuns.forEach(run => {
    // Count by status
    stats[run.status]++;

    // Count by type
    stats.byType[run.agentType] = (stats.byType[run.agentType] || 0) + 1;
  });

  return stats;
}

/**
 * Delete agent runs older than a specific timestamp
 * @param olderThan - Timestamp threshold (epoch milliseconds)
 * @returns Number of runs deleted
 */
export async function clearOldAgentRuns(olderThan: number): Promise<number> {
  return await db.agentRuns
    .where('startedAt')
    .below(olderThan)
    .delete();
}

/**
 * Delete all completed and failed agent runs
 * @returns Number of runs deleted
 */
export async function clearFinishedAgentRuns(): Promise<number> {
  const completed = await db.agentRuns
    .where('status')
    .equals('completed')
    .delete();

  const failed = await db.agentRuns
    .where('status')
    .equals('failed')
    .delete();

  const cancelled = await db.agentRuns
    .where('status')
    .equals('cancelled')
    .delete();

  return completed + failed + cancelled;
}

/**
 * Get the most recent agent run for a specific type
 * @param agentType - Type of agent
 * @returns The most recent agent run or undefined
 */
export async function getLatestAgentRun(
  agentType: AgentType
): Promise<AgentRun | undefined> {
  const runs = await db.agentRuns
    .where('agentType')
    .equals(agentType)
    .reverse()
    .sortBy('startedAt');

  return runs[0];
}

/**
 * Get running duration for an agent run in milliseconds
 * @param id - Agent run ID
 * @returns Duration in milliseconds or null if run not found
 */
export async function getAgentRunDuration(id: number): Promise<number | null> {
  const run = await db.agentRuns.get(id);
  if (!run) return null;

  const endTime = run.completedAt || Date.now();
  return endTime - run.startedAt;
}

/**
 * Retry a failed agent run by creating a new run with the same input
 * @param id - Failed agent run ID
 * @returns New agent run with the same configuration
 */
export async function retryAgentRun(id: number): Promise<AgentRun | null> {
  const originalRun = await db.agentRuns.get(id);
  if (!originalRun) return null;

  return await createAgentRun({
    agentType: originalRun.agentType,
    status: 'pending',
    input: originalRun.input,
    metadata: {
      ...originalRun.metadata,
      retryOf: id
    }
  });
}

/**
 * Clear all agent runs
 * WARNING: This will delete all agent run history
 * @returns Number of runs deleted
 */
export async function clearAllAgentRuns(): Promise<number> {
  return await db.agentRuns.clear();
}
