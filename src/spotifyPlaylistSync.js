// spotifyPlaylistSync.js
// Utilitário para sincronizar a playlist do Spotify com as sugestões de música confirmadas

import { getUserAccessToken } from "./spotifyServer";

const PLAYLIST_ID = "7rEEyfVSL9e7UFZ2XMaSyC";
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

/**
 * Sincroniza a playlist com as sugestões de música confirmadas
 * @param {Array} confirmations - Array com as confirmações de presença
 */
export async function syncPlaylist(confirmations) {
  try {
    // Obtém todas as músicas sugeridas das confirmações
    const suggestedTracks = confirmations
      .filter((conf) => conf.status === "confirmado")
      .flatMap((conf) => conf.music_suggestions || [])
      .filter((track) => track.spotify_id);

    // Obtém as músicas já na playlist
    const playlistTracks = await getPlaylistTracks();

    // Filtra apenas as músicas que ainda não estão na playlist
    const tracksToAdd = suggestedTracks
      .filter((track) => !playlistTracks.includes(track.spotify_id))
      .map((track) => track.spotify_id);

    // Adiciona as novas músicas à playlist
    if (tracksToAdd.length > 0) {
      await addTracksToPlaylist(tracksToAdd);
      console.log(`Adicionadas ${tracksToAdd.length} novas músicas à playlist`);
    } else {
      console.log("Nenhuma nova música para adicionar à playlist");
    }

    return {
      success: true,
      addedTracks: tracksToAdd.length,
    };
  } catch (error) {
    console.error("Erro ao sincronizar playlist:", error);
    throw error;
  }
}
