import { NextRequest, NextResponse } from "next/server";
import { getQueue, QueueName } from "@/lib/queue";
import { listCompletions, CompletionStatus } from "@/lib/db";

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
 * List completions with optional filters.
 *
 * Query params:
 *   - status: Filter by status (pending|processing|completed|failed)
 *   - limit: Max results (default: 50)
 *   - offset: Pagination offset (default: 0)
 *
 * Response:
 *   {
 *     "completions": [...],
 *     "count": number,
 *     "limit": number,
 *     "offset": number
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CompletionStatus | null;
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;

    const completions = await listCompletions({
      status: status ?? undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      completions,
      count: completions.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to list completions:", error);
    return NextResponse.json(
      { error: "Failed to list completions" },
      { status: 500 },
    );
  }
}
