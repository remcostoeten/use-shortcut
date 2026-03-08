import { useQuery } from "@tanstack/react-query";

export interface NpmMeta {
    version: string | null;
    lastPublishedAt: string | null;
    isLoading: boolean;
}

interface NpmStats {
    version: string | null;
    lastPublishedAt: string | null;
    weeklyDownloads: number | null;
    isLoading: boolean;
}

function encodeNpmPackageName(pkg: string): string {
    return encodeURIComponent(pkg);
}

type NpmRegistryPackageResponse = {
    "dist-tags"?: Record<string, string>;
    time?: Record<string, string>;
};

async function fetchLatestPackageMeta(
    pkg: string,
): Promise<{ version: string; lastPublishedAt: string | null }> {
    const res = await fetch(`https://registry.npmjs.org/${encodeNpmPackageName(pkg)}`);
    if (!res.ok) throw new Error("Failed to fetch npm metadata");
    const data = (await res.json()) as NpmRegistryPackageResponse;
    const version = data["dist-tags"]?.latest;
    if (!version) throw new Error("Missing npm dist-tag latest");
    const lastPublishedAt = data.time?.[version] ?? data.time?.modified ?? null;
    return { version, lastPublishedAt };
}

async function fetchWeeklyDownloads(pkg: string): Promise<number> {
    const res = await fetch(
        `https://api.npmjs.org/downloads/point/last-week/${pkg}`
    );
    if (!res.ok) throw new Error("Failed to fetch downloads");
    const data = await res.json();
    return data.downloads;
}

export function useNpmMeta(packageName: string): NpmMeta {
    const query = useQuery({
        queryKey: ["npm-meta", packageName],
        queryFn: () => fetchLatestPackageMeta(packageName),
        staleTime: 1000 * 60 * 60,
        retry: 1,
    });

    return {
        version: query.data?.version ?? null,
        lastPublishedAt: query.data?.lastPublishedAt ?? null,
        isLoading: query.isLoading,
    };
}

export function useNpmStats(packageName: string): NpmStats {
    const meta = useNpmMeta(packageName);

    const downloadsQuery = useQuery({
        queryKey: ["npm-downloads", packageName],
        queryFn: () => fetchWeeklyDownloads(packageName),
        staleTime: 1000 * 60 * 60,
        retry: 1,
    });

    return {
        version: meta.version,
        lastPublishedAt: meta.lastPublishedAt,
        weeklyDownloads: downloadsQuery.data ?? null,
        isLoading: meta.isLoading || downloadsQuery.isLoading,
    };
}
