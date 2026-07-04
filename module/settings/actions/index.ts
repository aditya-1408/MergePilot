"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { deleteWebhook } from "@/module/github/lib/github";

export async function getUserProfile() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const user = await prisma.user.findUnique({
  where: {
    id: session.user.id,
  },
  select: {
    id: true,
    name: true,
    email: true,
    image: true,
    createdAt: true,
  },
});
return user
  } catch (error) {

  }
}
export async function updateUserProfile(data: {
  name?: string;
  email?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const updateUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name:data.name,
        email:data.email
      },
      select:{
        id:true,
        name:true,
        email:true
      }
    });
revalidatePath("/dashboard/settings","page");
    return {
        success:true,
        user: updateUser
    }
  } catch (error) {
    
  }
}

export async function getConnectedRepositories() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const repositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
      },
    });

    return repositories;
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return [];
  }
}

export async function disconnectRepository(repositoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const repository = await prisma.repository.findUnique({
      where: {
        id: repositoryId,
        userId:session.user.id
      },
    });
   if (!repository) {
  throw new Error("Repository not found");
}

await deleteWebhook(
  repository.owner,
  repository.name
);

await prisma.repository.delete({
  where: {
    id: repositoryId,
    userId: session.user.id,
  },
});

revalidatePath("/dashboard/settings", "page");
revalidatePath("/dashboard/repository","page");
return {success:true}
  } catch (error) {
    console.error("Error disconnecting repository:",error)
    return { success:false, error:"Failed to disconnect repository"}
  }
}
 
export async function disconnectAllRepository() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const repositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
      },
    });

    await Promise.all(
      repositories.map(async (repo) => {
        await deleteWebhook(repo.owner, repo.name);
      })
    );

    await prisma.repository.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/settings", "page");
    revalidatePath("/dashboard/repository", "page");
    return { success: true, count: repositories.length };
  } catch (error) {
    console.error("Error disconnecting all repositories:", error);
    return { success: false, error: "Failed to disconnect all repositories" };
  }
}