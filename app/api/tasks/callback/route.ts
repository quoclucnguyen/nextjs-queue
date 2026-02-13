import { NextRequest, NextResponse } from "next/server";
import jobStore from "@/lib/job-store";

/**
 * POST /api/tasks/callback
 *
 * Called by the external BullMQ worker when a job finishes processing.
 *
 * Request body:
 *   { "jobId": "123", "status": "completed" | "failed", "result": { ... } }
 *
 * Response:
 *   { "success": true }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, status, result } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing required field: jobId" },
        { status: 400 },
      );
    }

    if (!status || !["completed", "failed"].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "completed" or "failed".' },
        { status: 400 },
      );
    }

    jobStore.set(jobId, {
      status,
      result: result ?? null,
      completedAt: new Date().toISOString(),
    });

    console.log(
      `[Callback] Job ${jobId} ${status}`,
      result ? JSON.stringify(result) : "",
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 },
    );
  }
}
