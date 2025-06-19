// spotifyServer.js
// Utilitário para buscar músicas diretamente na API do Spotify

import {
  logToStorage,
  needsSpotifyAuth,
  clearSpotifyAuth,
  saveSpotifyAuth,
} from "./utils";

const SPOTIFY_CLIENT_ID = "82045225ac554ca5a10aa806b6ab0515";
const SPOTIFY_CLIENT_SECRET = "f336d02deed4469586576ae2fb3944fa";

// Configuração da URL de redirecionamento baseada no ambiente
const getRedirectUri = () => {
  if (import.meta.env.DEV) {
    return "http://127.0.0.1:5173/callback";
  }

  // Para produção, sempre usar a URL configurada no Spotify Developer Dashboard
  // A URL https://niver2025.netlify.app/callback está configurada no Spotify
  return "https://niver2025.netlify.app/callback";
};

const REDIRECT_URI = getRedirectUri();

// Log da configuração para debug
console.log("Spotify Configuration:", {
  clientId: SPOTIFY_CLIENT_ID,
  redirectUri: REDIRECT_URI,
  isDev: import.meta.env.DEV,
  hostname: typeof window !== "undefined" ? window.location.hostname : "server",
  currentUrl: typeof window !== "undefined" ? window.location.href : "server",
  env: import.meta.env,
  mode: import.meta.env.MODE,
});

// Tokens para autenticação do app (client credentials)
let appAccessToken = null;
let appTokenExpiresAt = null;

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

// Função para obter o token de acesso do usuário
export async function getUserAccessToken() {
  try {
    console.log("Verificando token do usuário...");
    logToStorage("Verificando token do usuário...");

    // First check in-memory variables
    if (
      userAccessToken &&
      userTokenExpiresAt &&
      Date.now() < userTokenExpiresAt
    ) {
      console.log("Usando token em memória");
      logToStorage("Usando token em memória");
      return userAccessToken;
    }

    // If not in memory or expired, check localStorage
    const accessToken = localStorage.getItem("spotify_access_token");
    const refreshToken = localStorage.getItem("spotify_refresh_token");
    const expiresAt = localStorage.getItem("spotify_token_expires_at");

    // Initialize in-memory variables from localStorage
    userAccessToken = accessToken;
    userRefreshToken = refreshToken;
    userTokenExpiresAt = expiresAt ? parseInt(expiresAt) : 0;

    console.log("Tokens encontrados:", {
      accessToken: accessToken ? "presente" : "ausente",
      refreshToken: refreshToken ? "presente" : "ausente",
      expiresAt: expiresAt
        ? new Date(parseInt(expiresAt)).toLocaleString()
        : "ausente",
    });
    logToStorage(
      `Tokens encontrados: accessToken=${
        accessToken ? "presente" : "ausente"
      }, refreshToken=${refreshToken ? "presente" : "ausente"}, expiresAt=${
        expiresAt ? new Date(parseInt(expiresAt)).toLocaleString() : "ausente"
      }`
    );

    // Se não temos token ou ele expirou
    if (needsSpotifyAuth()) {
      console.log("Token não encontrado ou expirado");
      logToStorage("Token não encontrado ou expirado");

      // Se temos refresh token, tentamos renovar
      const refreshTokenToUse = userRefreshToken || refreshToken;
      if (refreshTokenToUse) {
        console.log("Tentando renovar token com refresh token...");
        logToStorage("Tentando renovar token com refresh token...");

        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(
              `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
            )}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshTokenToUse,
          }),
        });

        if (!response.ok) {
          console.error("Erro ao renovar token:", response.status);
          logToStorage(`Erro ao renovar token: ${response.status}`, "error");
          clearSpotifyAuth();
          // Clear in-memory variables
          userAccessToken = null;
          userRefreshToken = null;
          userTokenExpiresAt = 0;
          return null;
        }

        const data = await response.json();
        console.log("Token renovado com sucesso");
        logToStorage("Token renovado com sucesso");

        // Update both localStorage and in-memory variables
        saveSpotifyAuth(data);
        userAccessToken = data.access_token;
        userTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

        return data.access_token;
      }

      return null;
    }

    return accessToken;
  } catch (error) {
    console.error("Erro ao obter token do usuário:", error);
    logToStorage(`Erro ao obter token do usuário: ${error.message}`, "error");
    return null;
  }
}

// Função para gerar URL de autorização
export function getAuthUrl() {
  try {
    console.log("Gerando URL de autorização...");
    logToStorage("Gerando URL de autorização...");

    // Log do ambiente
    console.log("Ambiente:", {
      hostname: window.location.hostname,
      origin: window.location.origin,
      href: window.location.href,
      pathname: window.location.pathname,
      isDev: import.meta.env.DEV,
    });
    logToStorage(
      `Ambiente: ${JSON.stringify({
        hostname: window.location.hostname,
        origin: window.location.origin,
        href: window.location.href,
        pathname: window.location.pathname,
        isDev: import.meta.env.DEV,
      })}`
    );

    console.log("REDIRECT_URI:", REDIRECT_URI);
    logToStorage(`REDIRECT_URI: ${REDIRECT_URI}`);

    // Salvar a página atual para retornar depois
    const currentPath = window.location.pathname;
    console.log("Salvando página atual:", currentPath);
    logToStorage(`Salvando página atual: ${currentPath}`);
    localStorage.setItem("spotify_return_to", currentPath);

    // Gerar state aleatório para segurança
    const state = Math.random().toString(36).substring(7);
    console.log("State gerado:", state);
    logToStorage(`State gerado: ${state}`);

    // Store state in localStorage before generating the URL
    localStorage.setItem("spotify_auth_state", state);
    console.log(
      "State salvo no localStorage:",
      localStorage.getItem("spotify_auth_state")
    );
    logToStorage(
      `State salvo no localStorage: ${localStorage.getItem(
        "spotify_auth_state"
      )}`
    );

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: PLAYLIST_SCOPES,
      state: state,
      show_dialog: "true",
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    console.log("URL de autorização gerada:", authUrl);
    logToStorage(`URL de autorização gerada: ${authUrl}`);

    return authUrl;
  } catch (error) {
    console.error("Erro ao gerar URL de autorização:", error);
    logToStorage(`Erro ao gerar URL de autorização: ${error.message}`, "error");
    throw error;
  }
}

export async function handleCallback(code, state) {
  try {
    console.log("Processando callback...");
    logToStorage("Processando callback...");
    console.log("Código recebido:", code);
    console.log("State recebido:", state);

    // Verificar state para segurança
    const savedState = localStorage.getItem("spotify_auth_state");
    console.log("State salvo:", savedState);
    logToStorage(`State salvo: ${savedState}`);

    if (!savedState) {
      const error = "State não encontrado no localStorage";
      console.error(error);
      logToStorage(error, "error");
      throw new Error(error);
    }

    if (state !== savedState) {
      const error = "State mismatch - possível ataque CSRF";
      console.error(error);
      logToStorage(error, "error");
      throw new Error(error);
    }

    // Limpar o state imediatamente após verificação
    localStorage.removeItem("spotify_auth_state");
    console.log("State removido do localStorage após verificação");
    logToStorage("State removido do localStorage após verificação");

    const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);

    console.log("Enviando requisição para obter token...");
    logToStorage("Enviando requisição para obter token...");

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
      const errorText = await response.text();
      console.error("Erro na resposta da API:", response.status, errorText);
      logToStorage(
        `Erro na resposta da API: ${response.status} - ${errorText}`,
        "error"
      );

      // Se o código já foi usado, limpar os tokens existentes
      if (response.status === 400 && errorText.includes("invalid_grant")) {
        console.log(
          "Código de autorização inválido ou já usado, limpando tokens..."
        );
        logToStorage(
          "Código de autorização inválido ou já usado, limpando tokens..."
        );
        clearSpotifyAuth();
        userAccessToken = null;
        userRefreshToken = null;
        userTokenExpiresAt = 0;
      }

      throw new Error(
        `Failed to get access token: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Token obtido com sucesso");
    logToStorage("Token obtido com sucesso");

    // Save tokens using utility function
    saveSpotifyAuth(data);

    // Update in-memory variables
    userAccessToken = data.access_token;
    userRefreshToken = data.refresh_token;
    userTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

    // Verificar se os tokens foram salvos
    const savedAccessToken = localStorage.getItem("spotify_access_token");
    const savedRefreshToken = localStorage.getItem("spotify_refresh_token");
    const savedExpiresAt = localStorage.getItem("spotify_token_expires_at");

    console.log("Tokens salvos:", {
      accessToken: savedAccessToken ? "presente" : "ausente",
      refreshToken: savedRefreshToken ? "presente" : "ausente",
      expiresAt: savedExpiresAt
        ? new Date(parseInt(savedExpiresAt)).toLocaleString()
        : "ausente",
    });
    logToStorage(
      `Tokens salvos: accessToken=${
        savedAccessToken ? "presente" : "ausente"
      }, refreshToken=${
        savedRefreshToken ? "presente" : "ausente"
      }, expiresAt=${
        savedExpiresAt
          ? new Date(parseInt(savedExpiresAt)).toLocaleString()
          : "ausente"
      }`
    );

    return data;
  } catch (error) {
    console.error("Erro no callback:", error);
    logToStorage(`Erro no callback: ${error.message}`, "error");
    throw error;
  }
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
