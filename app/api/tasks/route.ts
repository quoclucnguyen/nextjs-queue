import { NextRequest, NextResponse } from "next/server";
import { getQueue, QueueName } from "@/lib/queue";

/**
 * POST /api/tasks
 *
 * Creates a new job in the BullMQ "tasks" queue.
 *
 * Request body:
 *   { "name": "job-name", "data": { ... } }
 *
 * Response:
 *   { "jobId": "123", "name": "job-name", "status": "queued" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, data } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 },
      );
    }

    const queue = getQueue(QueueName.EMAILS);
    const job = await queue.add(name, data ?? {});

    return NextResponse.json(
      {
        jobId: job.id,
        name: job.name,
        status: "queued",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
