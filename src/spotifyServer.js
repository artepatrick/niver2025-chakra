// spotifyServer.js
// Utilitário para buscar músicas diretamente na API do Spotify
// Coloque seu access token abaixo (veja instruções no README ou na documentação do Spotify)

const SPOTIFY_CLIENT_ID = "82045225ac554ca5a10aa806b6ab0515";
const SPOTIFY_CLIENT_SECRET = "f336d02deed4469586576ae2fb3944fa";

let accessToken = null;
let tokenExpiresAt = 0;

async function getSpotifyAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiresAt) {
    return accessToken;
  }

  const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error("Erro ao obter access token do Spotify");
  }
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000; // 1 min de margem
  return accessToken;
}

/**
 * Busca músicas no Spotify
 * @param {string} query - Termo de busca (nome da música, artista, etc)
 * @param {number} limit - Quantidade máxima de resultados (padrão: 10)
 * @returns {Promise<Array>} - Array de músicas encontradas
 */
export async function searchSpotify(query, limit = 10) {
  const token = await getSpotifyAccessToken();
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
    query
  )}&type=track&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });
  if (!res.ok) {
    throw new Error("Erro ao buscar músicas no Spotify: " + res.status);
  }
  const data = await res.json();
  return data.tracks?.items || [];
}
