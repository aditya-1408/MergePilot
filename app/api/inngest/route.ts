import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processTask } from "@/inngest/functions";

const handler = serve({
  client: inngest,
  functions: [processTask],
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
