"use server";

import { headers } from "next/headers";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateUserTier } from "@/module/payment/lib/subscription";
import { polarClient } from "@/module/payment/config/polar";

export async function syncSubscriptionStatus() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  try {
    let polarCustomerId = user.polarCustomerId;

    // If no customer ID stored, look up by email from Polar
    if (!polarCustomerId) {
      const customersResult = await polarClient.customers.list({
        email: user.email,
      });
      const customer = customersResult.result?.items?.[0];
      if (!customer) {
        return { success: true, status: "NO_CUSTOMER" };
      }
      polarCustomerId = customer.id;
      // Save it for future use
      await prisma.user.update({
        where: { id: user.id },
        data: { polarCustomerId },
      });
    }

    const result = await polarClient.subscriptions.list({
      customerId: polarCustomerId,
    });

    const subscriptions = result.result?.items || [];
    const activeSub = subscriptions.find((sub: any) => sub.status === "active");
    const latestSub = subscriptions[0];

    if (activeSub) {
      await updateUserTier(user.id, "PRO", "ACTIVE", activeSub.id);
      return { success: true, status: "ACTIVE" };
    } else if (latestSub) {
      const status = latestSub.status === "canceled" ? "CANCELED" : "EXPIRED";
      if (latestSub.status !== "active") {
        await updateUserTier(user.id, "FREE", status, latestSub.id);
      }
      return { success: true, status };
    }

    return { success: true, status: "NO_SUBSCRIPTION" };
  } catch (error) {
    console.error("Failed to sync subscription:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to sync with Polar" };
  }
}
