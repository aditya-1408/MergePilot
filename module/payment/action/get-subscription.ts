"use server";

import { headers } from "next/headers";
import prisma from "@/lib/db";
import { getRemainingLimits } from "@/module/payment/lib/subscription";
import { auth } from "@/lib/auth";

export async function getSubscriptionData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { user: null, limits: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return { user: null, limits: null };
  }

  const limits = await getRemainingLimits(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier || "FREE",
      subscriptionStatus: user.subscriptionStatus || null,
      polarCustomerId: user.polarCustomerId || null,
      polarSubscriptionId: user.polarSubscriptionId || null,
    },
    limits,
  };
}
