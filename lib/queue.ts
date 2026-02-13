import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

const redis = new IORedis(REDIS_URL!, {
  maxRetriesPerRequest: null,
});

/**
 * Queue names enum
 */
export enum QueueName {
  EMAILS = "emails",
  COMPLETION = "completion",
}

// Singleton Queue instance — reused across API routes
const queueCache = new Map<string, Queue>();

export function getQueue(queueName: QueueName | string): Queue {
  if (!queueCache.has(queueName)) {
    queueCache.set(queueName, new Queue(queueName, { connection: redis }));
  }
  return queueCache.get(queueName)!;
}
