import { useQuery } from "@tanstack/react-query";

function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

type GitHubRepoResponse = {
  pushed_at?: string;
  updated_at?: string;
};

async function fetchGitHubRepoUpdatedAt(githubUrl: string): Promise<string> {
  const repo = parseGitHubRepoUrl(githubUrl);
  if (!repo) throw new Error("Invalid GitHub repo url");
  const res = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch GitHub repo metadata");
  const data = (await res.json()) as GitHubRepoResponse;
  const latestCodeUpdateAt = data.pushed_at ?? data.updated_at;
  if (!latestCodeUpdateAt) throw new Error("Missing pushed_at and updated_at");
  return latestCodeUpdateAt;
}

export function useGitHubRepoUpdatedAt(githubUrl?: string): {
  updatedAt: string | null;
  isLoading: boolean;
} {
  const enabled = Boolean(githubUrl);
  const query = useQuery({
    queryKey: ["github-repo-updated-at", githubUrl],
    queryFn: () => fetchGitHubRepoUpdatedAt(githubUrl ?? ""),
    enabled,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  return {
    updatedAt: query.data ?? null,
    isLoading: enabled ? query.isLoading : false,
  };
}
