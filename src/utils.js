/**
 * Utility function to log messages to localStorage
 * @param {string} message - The message to log
 * @param {string} type - The type of log (default: "log")
 */
export function logToStorage(message, type = "log") {
  try {
    const logs = JSON.parse(localStorage.getItem("spotifyLogs") || "[]");
    logs.push({
      message,
      type,
      timestamp: new Date().toISOString(),
    });
    // Keep only the last 1000 logs to prevent localStorage from getting too full
    const trimmedLogs = logs.slice(-1000);
    localStorage.setItem("spotifyLogs", JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error("Error logging to storage:", error);
  }
}

/**
 * Utility function to check if Spotify authentication is needed
 * @returns {boolean} - Whether authentication is needed
 */
export function needsSpotifyAuth() {
  const accessToken = localStorage.getItem("spotify_access_token");
  const expiresAt = localStorage.getItem("spotify_token_expires_at");
  return !accessToken || !expiresAt || Date.now() >= parseInt(expiresAt);
}

/**
 * Utility function to clear Spotify authentication state
 */
export function clearSpotifyAuth() {
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_refresh_token");
  localStorage.removeItem("spotify_token_expires_at");
  localStorage.removeItem("spotify_auth_state");
  localStorage.removeItem("spotify_sync_pending");
}

/**
 * Utility function to save Spotify authentication state
 * @param {Object} data - The authentication data from Spotify
 */
export function saveSpotifyAuth(data) {
  const expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  localStorage.setItem("spotify_access_token", data.access_token);
  if (data.refresh_token) {
    localStorage.setItem("spotify_refresh_token", data.refresh_token);
  }
  localStorage.setItem("spotify_token_expires_at", expiresAt.toString());
}
