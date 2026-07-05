import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { indexRepo } from "@/inngest/functions";
import { generateReview } from "@/inngest/functions/review";

const handler = serve({
  client: inngest,
  functions: [indexRepo, generateReview],
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
