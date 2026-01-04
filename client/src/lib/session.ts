// Session management helper functions
// Session timeout: 15 minutes (900000 ms)
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const LAST_ACTIVITY_KEY = 'lastActivity';

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  if (localStorage.getItem("token")) {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number | null {
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  return lastActivity ? parseInt(lastActivity, 10) : null;
}

/**
 * Check if session has expired
 */
export function isSessionExpired(): boolean {
  const token = localStorage.getItem("token");
  if (!token) {
    return true;
  }

  const lastActivity = getLastActivity();
  if (!lastActivity) {
    return false; // No activity recorded yet, consider it active
  }

  const timeSinceLastActivity = Date.now() - lastActivity;
  return timeSinceLastActivity > SESSION_TIMEOUT;
}

/**
 * Clear session data
 */
export function clearSession(): void {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem("token");
}

/**
 * Initialize session (called on login)
 */
export function initSession(): void {
  updateLastActivity();
}

/**
 * Get time remaining until session expires (in milliseconds)
 */
export function getTimeUntilExpiry(): number {
  const lastActivity = getLastActivity();
  if (!lastActivity) {
    return SESSION_TIMEOUT;
  }

  const timeSinceLastActivity = Date.now() - lastActivity;
  const timeRemaining = SESSION_TIMEOUT - timeSinceLastActivity;
  return Math.max(0, timeRemaining);
}

