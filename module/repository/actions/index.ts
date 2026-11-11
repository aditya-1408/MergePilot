"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createWebhook, getRepositories } from "@/module/github/lib/github";
import { inngest } from "@/inngest/client";
import { canConnectRepository,decrementRepositoryCount,incrementRepositoryCount } from "@/module/payment/lib/subscription";


export async function fetchRepositories(
  page: number = 1,
  perPage: number = 10
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const githubRepos = await getRepositories(page, perPage); 

  const dbRepos = await prisma.repository.findMany({
  where: {
    userId: session.user.id,
  },
});

const connectedRepoIds = new Set(
  dbRepos.map((repo) => repo.githubId)
);

return githubRepos.map((repo: any) => ({
  ...repo,
  isConnected: connectedRepoIds.has(BigInt(repo.id)),
}));
}
export async function connectRepository(
  owner: string,
  repo: string,
  githubId: number
) {
  try {
    console.log("=== Connect Repository Debug ===");
    console.log("Owner:", owner);
    console.log("Repo:", repo);
    console.log("GitHub ID:", githubId);

    // Get session
    let session;
    try {
      session = await auth.api.getSession({
        headers: await headers(),
      });
      console.log("Session retrieved:", session ? "YES" : "NO");
      console.log("User ID:", session?.user?.id);
    } catch (sessionError) {
      console.error("Session error:", sessionError);
      throw new Error("Failed to retrieve session. Please log in again.");
    }

    if (!session?.user?.id) {
      throw new Error("Unauthorized - No active session. Please log in.");
    }

    // Check if user can connect more repos
    console.log("Checking repository limits...");
    let canConnect;
    try {
      canConnect = await canConnectRepository(session.user.id);
      console.log("Can connect:", canConnect);
    } catch (limitError) {
      console.error("Limit check error:", limitError);
      throw new Error("Failed to check repository limits. Please try again.");
    }

    if (!canConnect) {
      throw new Error(
        "Repository limit reached. Please upgrade to Pro for unlimited repositories."
      );
    }

    // Check if repository is already connected
    console.log("Checking for existing repository...");
    let existingRepo;
    try {
      existingRepo = await prisma.repository.findFirst({
        where: {
          githubId: BigInt(githubId),
          userId: session.user.id,
        },
      });
      console.log("Existing repo:", existingRepo ? "Found" : "Not found");
    } catch (dbError) {
      console.error("Database check error:", dbError);
      throw new Error("Failed to check existing repositories. Please try again.");
    }

    if (existingRepo) {
      console.log("Repository already connected");
      return { success: true, message: "Repository already connected" };
    }

    // Create webhook
    console.log("Creating webhook...");
    let webhook;
    try {
      webhook = await createWebhook(owner, repo);
      console.log("Webhook created:", webhook?.id);
    } catch (webhookError) {
      console.error("Webhook creation error:", webhookError);
      throw new Error("Failed to create GitHub webhook. Check your GitHub token and permissions.");
    }

    if (!webhook) {
      throw new Error("Failed to create webhook. Please ensure you have admin access to the repository.");
    }

    // Create repository record
    console.log("Creating repository record...");
    try {
      await prisma.repository.create({
        data: {
          githubId: BigInt(githubId),
          name: repo,
          owner,
          fullName: `${owner}/${repo}`,
          url: `https://github.com/${owner}/${repo}`,
          userId: session.user.id,
        },
      });
      console.log("Repository record created");
    } catch (createError) {
      console.error("Repository creation error:", createError);
      throw new Error("Failed to save repository to database. Please try again.");
    }

    // Increment repository count
    console.log("Incrementing repository count...");
    try {
      await incrementRepositoryCount(session.user.id);
      console.log("Repository count incremented");
    } catch (incrementError) {
      console.error("Failed to increment count:", incrementError);
      // Don't throw - repository is already created
    }

    // Trigger repository indexing (fire and forget)
    try {
      console.log("Triggering Inngest job...");
      await inngest.send({
        name: "repository.connected",
        data: {
          owner,
          repo,
          userId: session.user.id,
        },
      });
      console.log("Inngest job triggered");
    } catch (inngestError) {
      console.error("Failed to trigger repository indexing:", inngestError);
      // Don't throw - repository is already created
    }

    console.log("=== Connect Repository Success ===");
    return { success: true, message: "Repository connected successfully" };
  } catch (error) {
    console.error("=== Connect Repository Error ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : "Failed to connect repository. Please try again.";
    throw new Error(errorMessage);
  }
}