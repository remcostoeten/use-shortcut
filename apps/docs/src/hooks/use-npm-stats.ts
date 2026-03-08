import { useQuery } from "@tanstack/react-query";

interface NpmStats {
    version: string | null;
    weeklyDownloads: number | null;
    isLoading: boolean;
}

async function fetchLatestVersion(pkg: string): Promise<string> {
    const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`);
    if (!res.ok) throw new Error("Failed to fetch version");
    const data = await res.json();
    return data.version;
}

async function fetchWeeklyDownloads(pkg: string): Promise<number> {
    const res = await fetch(
        `https://api.npmjs.org/downloads/point/last-week/${pkg}`
    );
    if (!res.ok) throw new Error("Failed to fetch downloads");
    const data = await res.json();
    return data.downloads;
}

export function useNpmStats(packageName: string): NpmStats {
    const versionQuery = useQuery({
        queryKey: ["npm-version", packageName],
        queryFn: () => fetchLatestVersion(packageName),
        staleTime: 1000 * 60 * 60,
        retry: 1,
    });

    const downloadsQuery = useQuery({
        queryKey: ["npm-downloads", packageName],
        queryFn: () => fetchWeeklyDownloads(packageName),
        staleTime: 1000 * 60 * 60,
        retry: 1,
    });

    return {
        version: versionQuery.data ?? null,
        weeklyDownloads: downloadsQuery.data ?? null,
        isLoading: versionQuery.isLoading || downloadsQuery.isLoading,
    };
}
