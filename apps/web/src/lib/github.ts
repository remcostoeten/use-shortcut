"use server"

export async function getLatestCommit() {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
    const owner = "remcostoeten"
    const repo = "use-shortcut"
    const branch = "master"

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                },
                next: { revalidate: 60 },
            }
        )

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`)
        }

        const data = await response.json()

        return {
            message: data.commit.message,
            timestamp: data.commit.author.date,
            sha: data.sha.substring(0, 7),
            url: data.html_url,
        }
    } catch (error) {
        console.error("Failed to fetch latest commit:", error)
        return null
    }
}

export async function getLatestRelease() {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
    const owner = "remcostoeten"
    const repo = "use-shortcut"

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                },
                next: { revalidate: 3600 },
            }
        )

        if (response.status === 404) {
            return null
        }

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`)
        }

        const data = await response.json()

        return {
            version: data.tag_name.replace(/^v/, ''),
            name: data.name,
            url: data.html_url,
            publishedAt: data.published_at,
        }
    } catch (error) {
        console.error("Failed to fetch latest release:", error)
        return null
    }
}
