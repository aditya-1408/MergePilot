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

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log("Session:", session?.user?.id);

    if (!session) {
      throw new Error("Unauthorized - No session found");
    }

    // Check if user can connect more repos
    console.log("Checking if user can connect repository...");
    const canConnect = await canConnectRepository(session.user.id);
    console.log("Can connect:", canConnect);

    if (!canConnect) {
      throw new Error(
        "Repository limit reached. Please upgrade to Pro for unlimited repositories."
      );
    }

    // Check if repository is already connected
    console.log("Checking for existing repository...");
    const existingRepo = await prisma.repository.findFirst({
      where: {
        githubId: BigInt(githubId),
        userId: session.user.id,
      },
    });

    if (existingRepo) {
      console.log("Repository already connected");
      return { success: true, message: "Repository already connected" };
    }

    // Create webhook
    console.log("Creating webhook...");
    const webhook = await createWebhook(owner, repo);
    console.log("Webhook created:", webhook?.id);

    if (webhook) {
      // Create repository record
      console.log("Creating repository record...");
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

      // Increment repository count
      console.log("Incrementing repository count...");
      await incrementRepositoryCount(session.user.id);
      console.log("Repository count incremented");

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
      } catch (error) {
        console.error("Failed to trigger repository indexing:", error);
      }
    }

    console.log("=== Connect Repository Success ===");
    return { success: true, message: "Repository connected successfully" };
  } catch (error) {
    console.error("=== Connect Repository Error ===");
    console.error("Error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    const errorMessage = error instanceof Error ? error.message : "Failed to connect repository";
    throw new Error(errorMessage);
  }
}