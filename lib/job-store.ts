export interface JobResult {
  status: "completed" | "failed";
  result?: unknown;
  completedAt: string;
}

/**
 * In-memory store for job results received via the callback API.
 * Key: jobId (string)
 *
 * NOTE: This is ephemeral — data is lost on server restart.
 * For production, replace with a database.
 */
const jobStore = new Map<string, JobResult>();

export default jobStore;
