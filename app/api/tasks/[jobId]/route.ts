import { NextRequest, NextResponse } from "next/server";
import { getQueue } from "@/lib/queue";
import jobStore from "@/lib/job-store";

/**
 * GET /api/tasks/:jobId
 *
 * Check the status of a job.
 * First checks the in-memory store (populated by the callback API),
 * then falls back to querying the BullMQ queue in Redis.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    // 1. Check in-memory store first (callback already received)
    const stored = jobStore.get(jobId);
    if (stored) {
      return NextResponse.json({
        jobId,
        status: stored.status,
        result: stored.result,
        completedAt: stored.completedAt,
      });
    }

    // 2. Fallback: query BullMQ / Redis for current job state
    const queue = getQueue('emails');
    const job = await queue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 },
      );
    }

    const state = await job.getState();

    return NextResponse.json({
      jobId: job.id,
      name: job.name,
      status: state, // "waiting" | "active" | "completed" | "failed" | "delayed" | ...
      data: job.data,
      progress: job.progress,
    });
  } catch (error) {
    console.error("Failed to get task status:", error);
    return NextResponse.json(
      { error: "Failed to get task status" },
      { status: 500 },
    );
  }
}
