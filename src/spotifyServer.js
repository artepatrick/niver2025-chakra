// spotifyServer.js
// Utilitário para buscar músicas diretamente na API do Spotify

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.DEV
  ? "http://localhost:5173"
  : "https://niver2025.netlify.app";

// Tokens para autenticação do app (client credentials)
let appAccessToken = null;
let appTokenExpiresAt = 0;

// Tokens para autenticação do usuário
let userAccessToken = null;
let userRefreshToken = null;
let userTokenExpiresAt = 0;

// Scopes necessários para as operações de playlist
const PLAYLIST_SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

// Função existente para obter token do app (client credentials)
export async function getSpotifyAccessToken() {
  const now = Date.now();
  if (appAccessToken && now < appTokenExpiresAt) {
    return appAccessToken;
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
  appAccessToken = data.access_token;
  appTokenExpiresAt = now + (data.expires_in - 60) * 1000; // 1 min de margem
  return appAccessToken;
}

// Nova função para obter token do usuário (apenas para operações de playlist)
export async function getUserAccessToken() {
  // Try to load tokens from localStorage
  if (!userAccessToken) {
    userAccessToken = localStorage.getItem("spotify_access_token");
    userRefreshToken = localStorage.getItem("spotify_refresh_token");
    userTokenExpiresAt = parseInt(
      localStorage.getItem("spotify_token_expires_at") || "0"
    );
  }

  // If no tokens are available, user needs to authenticate
  if (!userAccessToken || !userRefreshToken) {
    const authUrl = getAuthUrl();
    window.location.href = authUrl;
    return null;
  }

  // Check if token needs refresh
  if (Date.now() >= userTokenExpiresAt) {
    await refreshUserToken();
  }

  return userAccessToken;
}

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: PLAYLIST_SCOPES,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function handleCallback(code) {
  const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get access token");
  }

  const data = await response.json();

  // Store tokens in localStorage
  localStorage.setItem("spotify_access_token", data.access_token);
  localStorage.setItem("spotify_refresh_token", data.refresh_token);
  localStorage.setItem(
    "spotify_token_expires_at",
    Date.now() + (data.expires_in - 60) * 1000
  );

  // Update in-memory tokens
  userAccessToken = data.access_token;
  userRefreshToken = data.refresh_token;
  userTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return data;
}

async function refreshUserToken() {
  if (!userRefreshToken) {
    throw new Error("No refresh token available");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: userRefreshToken,
    client_id: SPOTIFY_CLIENT_ID,
    client_secret: SPOTIFY_CLIENT_SECRET,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!res.ok) {
    throw new Error("Erro ao atualizar token do Spotify");
  }

  const data = await res.json();
  userAccessToken = data.access_token;
  userTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  // Update stored tokens
  localStorage.setItem("spotify_access_token", userAccessToken);
  localStorage.setItem("spotify_token_expires_at", userTokenExpiresAt);
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

  // Transforma os resultados para incluir apenas as informações necessárias
  return (data.tracks?.items || []).map((track) => {
    // Create a new object without available_markets using destructuring
    const { album, ...trackWithoutMarkets } = track;
    const { available_markets: _, ...albumWithoutMarkets } = album || {};

    // Get the album image URL
    const albumImageUrl =
      albumWithoutMarkets.images && albumWithoutMarkets.images.length > 0
        ? albumWithoutMarkets.images[0].url
        : null;

    return {
      spotify_id: trackWithoutMarkets.id,
      song_title: trackWithoutMarkets.name,
      artist: trackWithoutMarkets.artists
        .map((artist) => artist.name)
        .join(", "),
      album_name: albumWithoutMarkets.name,
      album_image_url: albumImageUrl,
      preview_url: trackWithoutMarkets.preview_url,
      duration_ms: trackWithoutMarkets.duration_ms,
      spotify_url: trackWithoutMarkets.external_urls.spotify,
    };
  });
}
