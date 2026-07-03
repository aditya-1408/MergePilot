import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

/**
 * Getting the github access token
 */
export async function getGithubToken() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });
  if (!account?.accessToken) {
    throw new Error("No github access token found");
  }
  return account.accessToken;
}

interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionData {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: ContributionWeek[];
      };
    };
  };
}

export async function fetchUserContribution(token: string, username: string) {
  const octokit = new Octokit({ auth: token });
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await octokit.graphql<ContributionData>(query, {
      username,
    });
    return response.user.contributionsCollection.contributionCalendar;
  } catch (error) {
    console.error("Failed to fetch contributions:", error);
    return null;
  }
}

export async function getRepositories(
  page: number = 1,
  perPage: number = 10
) {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    direction: "desc",
    visibility: "all",
    per_page: perPage,
    page: page,
  });
  return data;
}
export async function createWebhook(owner: string, repo: string) {
  const token = await getGithubToken();

  const octokit = new Octokit({ auth: token });

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`;

  const { data: hooks } =
    await octokit.rest.repos.listWebhooks({
      owner,
      repo,
    });

  const existingHook = hooks.find(
    (hook) => hook.config.url === webhookUrl
  );

  if (existingHook) {
    return  existingHook
  }
    const { data } = await octokit.rest.repos.createWebhook({
  owner,
  repo,
  config: {
    url: webhookUrl,
    content_type: "json",
  },
  events: ["pull_request"],
});

return data;
}
