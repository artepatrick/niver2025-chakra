// spotifyPlaylistSync.js
// Utilitário para sincronizar a playlist do Spotify com as sugestões de música confirmadas

import { getUserAccessToken } from "./spotifyServer";

const PLAYLIST_ID = "3885YwVwdWiLefIxZfmu3d";
const BATCH_SIZE = 50; // Spotify API limit for adding tracks

/**
 * Obtém todas as músicas da playlist
 * @returns {Promise<Array>} - Array com os IDs das músicas na playlist
 */
async function getPlaylistTracks() {
  const token = await getUserAccessToken();
  if (!token) return []; // Retorna array vazio se não houver autenticação

  const tracks = [];
  let nextUrl = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=100`;

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Erro ao buscar músicas da playlist: ${res.status}`);
    }

    const data = await res.json();
    tracks.push(...data.items.map((item) => item.track.id));
    nextUrl = data.next;
  }

  return tracks;
}

/**
 * Adiciona músicas à playlist em lotes
 * @param {Array<string>} trackIds - Array com os IDs das músicas a serem adicionadas
 */
async function addTracksToPlaylist(trackIds) {
  if (!trackIds.length) return;

  const token = await getUserAccessToken();
  if (!token) return; // Não faz nada se não houver autenticação

  // Process tracks in batches
  for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
    const batch = trackIds.slice(i, i + BATCH_SIZE);
    const uris = batch.map((id) => `spotify:track:${id}`);

    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris }),
      }
    );

    if (!res.ok) {
      throw new Error(`Erro ao adicionar músicas à playlist: ${res.status}`);
    }

    // Add a small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < trackIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Utilitário para gravar logs no localStorage
function logToStorage(message, type = "log") {
  const logs = JSON.parse(localStorage.getItem("sync_logs") || "[]");
  logs.push({ type, message, timestamp: new Date().toISOString() });
  localStorage.setItem("sync_logs", JSON.stringify(logs));
}

/**
 * Sincroniza a playlist com as sugestões de música confirmadas
 * @param {Array} confirmations - Array com as confirmações de presença
 */
export async function syncPlaylist(confirmations) {
  try {
    console.log("Iniciando sincronização da playlist...");
    logToStorage("Iniciando sincronização da playlist...");
    console.log("Número de confirmações:", confirmations.length);
    logToStorage(`Número de confirmações: ${confirmations.length}`);

    // Verificar autenticação primeiro
    const token = await getUserAccessToken();
    if (!token) {
      const msg =
        "Usuário não autenticado, redirecionando para autenticação...";
      console.log(msg);
      logToStorage(msg, "warn");
      return {
        success: false,
        error: "Usuário não autenticado",
        needsAuth: true,
      };
    }

    // Obtém todas as músicas sugeridas das confirmações
    const suggestedTracks = confirmations
      .filter((conf) => conf.status === "confirmado")
      .flatMap((conf) => conf.music_suggestions || [])
      .filter((track) => track.spotify_id);

    console.log("Músicas sugeridas encontradas:", suggestedTracks.length);
    logToStorage(`Músicas sugeridas encontradas: ${suggestedTracks.length}`);

    // Obtém as músicas já na playlist
    console.log("Obtendo músicas da playlist...");
    logToStorage("Obtendo músicas da playlist...");
    const playlistTracks = await getPlaylistTracks();
    console.log("Músicas na playlist:", playlistTracks.length);
    logToStorage(`Músicas na playlist: ${playlistTracks.length}`);

    // Filtra apenas as músicas que ainda não estão na playlist
    const tracksToAdd = suggestedTracks
      .filter((track) => !playlistTracks.includes(track.spotify_id))
      .map((track) => track.spotify_id);

    console.log("Músicas a serem adicionadas:", tracksToAdd.length);
    logToStorage(`Músicas a serem adicionadas: ${tracksToAdd.length}`);

    // Adiciona as novas músicas à playlist
    if (tracksToAdd.length > 0) {
      console.log("Adicionando músicas à playlist...");
      logToStorage("Adicionando músicas à playlist...");
      await addTracksToPlaylist(tracksToAdd);
      const msg = `Adicionadas ${tracksToAdd.length} novas músicas à playlist`;
      console.log(msg);
      logToStorage(msg);
    } else {
      const msg = "Nenhuma nova música para adicionar à playlist";
      console.log(msg);
      logToStorage(msg);
    }

    return {
      success: true,
      addedTracks: tracksToAdd.length,
    };
  } catch (error) {
    console.error("Erro ao sincronizar playlist:", error);
    logToStorage(`Erro ao sincronizar playlist: ${error.message}`, "error");
    console.error("Stack trace:", error.stack);
    logToStorage(`Stack trace: ${error.stack}`, "error");
    throw error;
  }
}
