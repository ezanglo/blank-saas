/**
 * Canonical public GitHub URL for the marketing clone CTA.
 * Override for forks via `NEXT_PUBLIC_GITHUB_REPO_URL` (build-time / `.env.local`).
 */
function resolvePublicGithubRepoUrl(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_GITHUB_REPO_URL?.trim()
      : undefined;
  const base = (
    fromEnv && fromEnv.length > 0
      ? fromEnv
      : "https://github.com/ezanglo/blank-saas"
  ).replace(/\/+$/, "");
  return base;
}

export const PUBLIC_GITHUB_REPO_URL = resolvePublicGithubRepoUrl();

export const GIT_CLONE_COMMAND = `git clone ${PUBLIC_GITHUB_REPO_URL}.git`;

/** Host + path for compact link labels, e.g. `github.com/ezanglo/blank-saas`. */
export function publicGithubRepoLabel(): string {
  try {
    const u = new URL(
      PUBLIC_GITHUB_REPO_URL.startsWith("http")
        ? PUBLIC_GITHUB_REPO_URL
        : `https://${PUBLIC_GITHUB_REPO_URL}`,
    );
    return `${u.hostname}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return "github.com/ezanglo/blank-saas";
  }
}
