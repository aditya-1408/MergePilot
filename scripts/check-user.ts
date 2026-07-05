import prisma from "../lib/db";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      polarCustomerId: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
