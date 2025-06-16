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
    localStorage.setItem("spotifyLogs", JSON.stringify(logs));
  } catch (error) {
    console.error("Error logging to storage:", error);
  }
}
