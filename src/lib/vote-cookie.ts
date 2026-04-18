/** HttpOnly cookie name after a successful vote for this poll slug. */
export function votedCookieName(slug: string): string {
  return `poll_voted_${slug}`;
}

export const VOTE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
