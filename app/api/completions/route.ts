import { NextRequest, NextResponse } from "next/server";
import { getQueue, QueueName } from "@/lib/queue";

/**
 * POST /api/completions
 *
 * Creates a new AI completion job in the BullMQ queue.
 *
 * Request body:
 *   {
 *     "model": string,
 *     "content": string,
 *     "systemMessage"?: string
 *   }
 *
 * Response:
 *   {
 *     "jobId": string,
 *     "status": "queued",
 *     "completionId": string
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, content, systemMessage } = body;

    // Validate required fields
    if (!model) {
      return NextResponse.json(
        { error: "Missing required field: model" },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Missing required field: content" },
        { status: 400 },
      );
    }

    // Generate a unique completion ID
    const completionId = `completion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Prepare job data matching the processor interface
    const jobData = {
      completionId,
      model,
      content,
      systemMessage,
    };

    // Add job to queue with retry strategy
    const queue = getQueue(QueueName.COMPLETION);
    const job = await queue.add("process", jobData, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    });

    return NextResponse.json(
      {
        jobId: job.id,
        status: "queued",
        completionId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create completion:", error);
    return NextResponse.json(
      { error: "Failed to create completion" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/completions
 *
 * Get completion status by job ID or completion ID.
 *
 * Query params:
 *   - jobId: BullMQ job ID
 *   - completionId: Custom completion identifier
 *
 * Response:
 *   {
 *     "job": { ... },
 *     "state": "completed" | "failed" | "active" | "waiting",
 *     "completionId": string
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const completionId = searchParams.get("completionId");

    if (!jobId && !completionId) {
      return NextResponse.json(
        { error: "Missing query param: jobId or completionId required" },
        { status: 400 },
      );
    }

    const queue = getQueue(QueueName.COMPLETION);

    if (jobId) {
      // Get job by BullMQ job ID
      const job = await queue.getJob(jobId);

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const state = await queue.getJobState(jobId);

      return NextResponse.json({
        jobId: job.id,
        name: job.name,
        data: job.data,
        state,
        progress: job.progress,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        attemptsMade: job.attemptsMade,
      });
    }

    // For completionId, we'd need to search jobs or maintain a separate index
    // This is a simplified implementation
    return NextResponse.json(
      { error: "Lookup by completionId requires additional indexing" },
      { status: 501 },
    );
  } catch (error) {
    console.error("Failed to get completion:", error);
    return NextResponse.json(
      { error: "Failed to get completion" },
      { status: 500 },
    );
  }
}
