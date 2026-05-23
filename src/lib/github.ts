// ── Types ─────────────────────────────────────────────────────────────────────

export interface RepoConfig {
  name: string;
  profile: 'active' | 'legacy';
  username: string;
  description: string;
  languageOverride?: string; // overrides GitHub API language (e.g. for forks)
  devpostUrl?: string;       // only set for clara-image-genie
}

export interface UnifiedRepo {
  name: string;
  profile: 'active' | 'legacy';
  description: string;
  htmlUrl: string;
  language: string | null;
  updatedAt: string;
  devpostUrl?: string;
}

export interface DailyContribution {
  date: string;   // YYYY-MM-DD
  count: number;
}

// ── Allowlist ─────────────────────────────────────────────────────────────────
// Only repos listed here will ever appear on the site.
// Descriptions are hardcoded here and override whatever is on GitHub.

export const REPO_ALLOWLIST: RepoConfig[] = [
  {
    name: 'skytrack-sa',
    profile: 'active',
    username: 'Chimdi-Ag',
    description:
      'Flight price tracker for South African routes. Compares current fares against 30 days of history and gives you a straight answer: good deal, average, or overpriced.',
  },
  {
    name: 'simple_shell',
    profile: 'legacy',
    username: 'chicode-dev',
    description:
      'A Unix shell written from scratch in C. Handles command parsing, built-ins, environment variables, and history. No standard library shortcuts.',
  },
  {
    name: 'monty',
    profile: 'legacy',
    username: 'chicode-dev',
    description:
      'Bytecode interpreter for the Monty scripting language, built in C. Reads opcode files and executes stack and queue instructions through a hand-built virtual machine.',
  },
  {
    name: 'My-bank-management-system',
    profile: 'legacy',
    username: 'chicode-dev',
    description:
      'Console-based banking app in C. Covers account creation, deposits, withdrawals, and balance lookups through a clean terminal interface.',
  },
  {
    name: 'SpellCheckerProject',
    profile: 'legacy',
    username: 'chicode-dev',
    description:
      'Spell checker in Java that flags errors against two dictionary structures, written to test the performance difference between them.',
  },
  {
    name: 'RSA-Factoring-Challenge',
    profile: 'legacy',
    username: 'chicode-dev',
    description:
      'Shell script that factors the large composites behind RSA encryption. A practical look at why prime factorization is the bottleneck of public-key security.',
  },
  {
    name: 'sorting_algorithms',
    profile: 'legacy',
    username: 'chicode-dev',
    description:
      'Eight sorting algorithms in C: bubble, insertion, selection, quick, merge, and more. Each annotated with its Big O time complexity.',
  },
  {
    name: 'SnakeGame',
    profile: 'legacy',
    username: 'chicode-dev',
    description:
      'The classic Snake game in Python. Arrow key controls, score tracking, and a game loop that does exactly what it needs to.',
  },
  {
    name: 'Collaborative_java_projects',
    profile: 'legacy',
    username: 'chicode-dev',
    description:
      'Three Java calculator implementations built as a team, including a Shunting Yard parser that handles operator precedence correctly.',
  },
  {
    name: 'clara-image-genie',
    profile: 'legacy',
    username: 'chicode-dev',
    description:
      'Built at a hackathon with a team, Clara is a local image search tool that uses a Vision Transformer, YOLOv3, and OCR to find photos by description, detected objects, or text in the image. Runs entirely offline. Took home an award.',
    languageOverride: 'Python / Django',
    devpostUrl: 'https://devpost.com/software/clara-image-genie',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays < 1) return 'Updated today';
  if (diffDays === 1) return 'Updated 1 day ago';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 5) return `Updated ${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `Updated ${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(diffDays / 365);
  return `Updated ${years} year${years > 1 ? 's' : ''} ago`;
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Returns YYYY-MM-DD in local time (toISOString() uses UTC and can be wrong in UTC+ timezones)
export function toYMD(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// ── Fetch repos ───────────────────────────────────────────────────────────────

interface GitHubRepoRaw {
  name: string;
  html_url: string;
  language: string | null;
  updated_at: string;
}

export async function fetchUnifiedRepos(): Promise<UnifiedRepo[]> {
  const allowMap = new Map<string, RepoConfig>();
  for (const config of REPO_ALLOWLIST) {
    allowMap.set(`${config.username}/${config.name}`, config);
  }

  const results: UnifiedRepo[] = [];

  await Promise.all(
    ['Chimdi-Ag', 'chicode-dev'].map(async (username) => {
      try {
        const res = await fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
          { headers: { Accept: 'application/vnd.github.v3+json' } }
        );
        if (!res.ok) {
          console.warn(`[github] repos fetch failed for ${username}: ${res.status}`);
          return;
        }
        const repos: GitHubRepoRaw[] = await res.json();
        for (const repo of repos) {
          const config = allowMap.get(`${username}/${repo.name}`);
          if (!config) continue;
          results.push({
            name: config.name,
            profile: config.profile,
            description: config.description,
            htmlUrl: repo.html_url,
            language: config.languageOverride ?? repo.language,
            updatedAt: repo.updated_at,
            devpostUrl: config.devpostUrl,
          });
        }
      } catch (err) {
        console.warn(`[github] network error for ${username}:`, err);
      }
    })
  );

  return results.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// ── Fetch contributions ───────────────────────────────────────────────────────

interface ContribApiDay {
  date: string;
  count: number;
}

interface ContribApiResponse {
  contributions: ContribApiDay[];
}

export async function fetchUnifiedContributions(): Promise<DailyContribution[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 363);
  const cutoffStr = toYMD(cutoff);

  const dateMaps: Map<string, number>[] = [];

  await Promise.all(
    ['Chimdi-Ag', 'chicode-dev'].map(async (username) => {
      const map = new Map<string, number>();
      dateMaps.push(map);
      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}`
        );
        if (!res.ok) {
          console.warn(`[github] contributions fetch failed for ${username}: ${res.status}`);
          return;
        }
        const data: ContribApiResponse = await res.json();
        for (const entry of data.contributions) {
          if (entry.date >= cutoffStr) {
            map.set(entry.date, entry.count);
          }
        }
      } catch (err) {
        console.warn(`[github] contributions network error for ${username}:`, err);
      }
    })
  );

  const allDates = new Set<string>();
  for (const map of dateMaps) {
    for (const date of map.keys()) allDates.add(date);
  }

  const merged: DailyContribution[] = [];
  for (const date of allDates) {
    const total = dateMaps.reduce((sum, m) => sum + (m.get(date) ?? 0), 0);
    merged.push({ date, count: total });
  }

  return merged.sort((a, b) => a.date.localeCompare(b.date));
}
