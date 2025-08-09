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

/**
 * Resolve the current host_id to be used by API calls
 * Priority: URL (?host_id= / ?host=) > localStorage > env (VITE_HOST_ID) > default UUID
 * Validates as UUID v4-like string
 * @returns {string}
 */
export function getHostId() {
  try {
    const DEFAULT_HOST_ID =
      process.env.NIVER2025_DEFAULT_HOST_ID ||
      "2f9623b8-b9f5-404a-b106-ab96aef4400b";
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // Try URL params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("host_id") || params.get("host");
      if (fromUrl && uuidRegex.test(fromUrl)) {
        localStorage.setItem("host_id", fromUrl);
        return fromUrl;
      }
    }

    // Try localStorage
    const fromStorage =
      typeof window !== "undefined" ? localStorage.getItem("host_id") : null;
    if (fromStorage && uuidRegex.test(fromStorage)) {
      return fromStorage;
    }

    // Try env
    const fromEnv = import.meta?.env?.VITE_HOST_ID;
    if (fromEnv && uuidRegex.test(fromEnv)) {
      return fromEnv;
    }

    // Fallback default
    return DEFAULT_HOST_ID;
  } catch (e) {
    console.warn("Failed to resolve host_id, using default.", e);
    return "2f9623b8-b9f5-404a-b106-ab96aef4400b";
  }
}
