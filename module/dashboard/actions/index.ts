"use server";

import { fetchUserContribution, getGithubToken } from "@/module/github/lib/github";
import { headers } from "next/headers";
import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function getDashboardStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const token = await getGithubToken();
    const octokit = new Octokit({ auth: token });

    const { data: user } = await octokit.rest.users.getAuthenticated();

    // Get total connected repos from DB
    const totalRepos = await prisma.repository.count({
      where: { userId: session.user.id },
    });

    const calendar = await fetchUserContribution(token, user.login);
    const totalCommits = calendar?.totalContributions || 0;

    const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${user.login} type:pr`,
      per_page: 1,
    });
    const totalPRs = prs.total_count;

    // Count AI reviews from database
    const totalReviews = await prisma.review.count({
      where: {
        repository: {
          userId: session.user.id,
        },
        status: "completed",
      },
    });

    return { totalCommits, totalPRs, totalReviews, totalRepos };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { totalCommits: 0, totalPRs: 0, totalReviews: 0, totalRepos: 0 };
  }
}

export async function getContributionStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const token = await getGithubToken();
    const octokit = new Octokit({ auth: token });

    const { data: user } = await octokit.rest.users.getAuthenticated();
    const calendar = await fetchUserContribution(token, user.login);

    if (!calendar) {
      return { contributions: [], totalContributions: 0 };
    }

    // react-activity-calendar expects { date, count, level } format
    const contributions = calendar.weeks
      .flatMap((week) => week.contributionDays)
      .map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: Math.min(4, Math.ceil(day.contributionCount / 5)) as 0 | 1 | 2 | 3 | 4,
      }));

    return {
      contributions,
      totalContributions: calendar.totalContributions,
    };
  } catch (error) {
    console.error("Error fetching contribution stats:", error);
    return { contributions: [], totalContributions: 0 };
  }
}

export async function getMonthlyActivity() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) throw new Error("Unauthorized");

    const token = await getGithubToken();
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const since = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const until = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const name = date.toLocaleString("default", { month: "short" });

      // commits via search
      const { data: commitData } = await octokit.rest.search.commits({
        q: `author:${user.login} author-date:${since.slice(0, 10)}..${until.slice(0, 10)}`,
        per_page: 1,
      });

      // PRs via search
      const { data: prData } = await octokit.rest.search.issuesAndPullRequests({
        q: `author:${user.login} type:pr created:${since.slice(0, 10)}..${until.slice(0, 10)}`,
        per_page: 1,
      });

      months.push({
        name,
        commits: commitData.total_count,
        prs: prData.total_count,
        reviews: 0, // TODO: from DB
      });
    }

    return months;
  } catch (error) {
    console.error("Error fetching monthly activity:", error);
    return [];
  }
}
