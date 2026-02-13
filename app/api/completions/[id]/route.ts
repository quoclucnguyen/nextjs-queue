import { NextRequest, NextResponse } from "next/server";
import {
  getCompletionById,
  getCompletionByCompletionId,
} from "@/lib/db";

/**
 * GET /api/completions/[id]
 *
 * Get completion by ID or completionId.
 *
 * Params:
 *   - id: Can be either UUID (id) or completionId
 *
 * Response:
 *   {
 *     "id": string,
 *     "completionId": string,
 *     "status": "pending" | "processing" | "completed" | "failed",
 *     "model": string,
 *     "userMessage": string,
 *     "responseContent"?: string,
 *     "promptTokens"?: number,
 *     "responseTokens"?: number,
 *     "totalTokens"?: number,
 *     "finishReason"?: string,
 *     "errorMessage"?: string,
 *     "attemptedAt"?: string,
 *     "completedAt"?: string,
 *     "createdAt": string,
 *     "updatedAt": string
 *   }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId");
    const isParamsPromise =
      params !== null &&
      typeof params === "object" &&
      typeof (params as { then?: unknown }).then === "function";

    console.info("[completions/:id] incoming request", {
      path: url.pathname,
      jobId,
      paramsType: typeof params,
      isParamsPromise,
    });

    const { id } = await params;

    console.info("[completions/:id] resolved route param", {
      id,
      jobId,
    });

    // Try to find by UUID first, then by completionId
    let completion = await getCompletionById(id);

    if (!completion) {
      completion = await getCompletionByCompletionId(id);
    }

    if (!completion) {
      return NextResponse.json(
        { error: "Completion not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(completion);
  } catch (error) {
    console.error("Failed to get completion:", error);
    return NextResponse.json(
      { error: "Failed to get completion" },
      { status: 500 },
    );
  }
}
