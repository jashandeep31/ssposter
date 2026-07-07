import { createHash, randomBytes } from "node:crypto";

import {
  connectedAccountPlatforms,
  type ConnectedAccountPlatform,
} from "@/lib/connected-accounts";

export type OAuthState = {
  platform: ConnectedAccountPlatform;
  state: string;
  codeVerifier?: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
};

type ProviderProfile = {
  providerAccountId: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
};

type ProviderConfig = {
  label: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  redirectUriEnv: string;
  authorizationUrl: string;
  tokenUrl: string;
  profileUrl: string;
  scopes: string[];
  usePkce?: boolean;
  exchangeToken: (
    code: string,
    redirectUri: string,
    state: OAuthState,
  ) => Promise<TokenResponse>;
  fetchProfile: (accessToken: string) => Promise<ProviderProfile>;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to connect publishing accounts.`);
  }

  return value;
}

function getClientCredentials(config: ProviderConfig) {
  return {
    clientId: getRequiredEnv(config.clientIdEnv),
    clientSecret: getRequiredEnv(config.clientSecretEnv),
    redirectUri: getRequiredEnv(config.redirectUriEnv),
  };
}

function createCodeChallenge(codeVerifier: string) {
  return createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}

async function parseTokenResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | TokenResponse
    | { error?: string; error_description?: string }
    | null;

  if (!response.ok || !payload || !("access_token" in payload)) {
    const error = payload && "error_description" in payload
      ? payload.error_description
      : "Token exchange failed.";

    throw new Error(error || "Token exchange failed.");
  }

  return payload;
}

export const socialProviders: Record<ConnectedAccountPlatform, ProviderConfig> = {
  x: {
    label: "X",
    clientIdEnv: "X_CLIENT_ID",
    clientSecretEnv: "X_CLIENT_SECRET",
    redirectUriEnv: "X_REDIRECT_URI",
    authorizationUrl: "https://x.com/i/oauth2/authorize",
    tokenUrl: "https://api.x.com/2/oauth2/token",
    profileUrl:
      "https://api.x.com/2/users/me?user.fields=profile_image_url,username,name",
    scopes: [
      "tweet.read",
      "tweet.write",
      "users.read",
      "media.write",
      "offline.access",
    ],
    usePkce: true,
    async exchangeToken(code, redirectUri, state) {
      const clientId = getRequiredEnv("X_CLIENT_ID");
      const clientSecret = getRequiredEnv("X_CLIENT_SECRET");
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
      });

      if (state.codeVerifier) {
        body.set("code_verifier", state.codeVerifier);
      }

      const response = await fetch("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`,
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      return parseTokenResponse(response);
    },
    async fetchProfile(accessToken) {
      const response = await fetch(
        "https://api.x.com/2/users/me?user.fields=profile_image_url,username,name",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        data?: {
          id?: string;
          name?: string;
          username?: string;
          profile_image_url?: string;
        };
      } | null;

      if (!response.ok || !payload?.data?.id) {
        throw new Error("Could not fetch X account profile.");
      }

      return {
        providerAccountId: payload.data.id,
        displayName: payload.data.name,
        username: payload.data.username,
        avatarUrl: payload.data.profile_image_url,
        metadata: payload.data,
      };
    },
  },
  linkedin: {
    label: "LinkedIn",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    redirectUriEnv: "LINKEDIN_REDIRECT_URI",
    authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    profileUrl: "https://api.linkedin.com/v2/userinfo",
    scopes: ["openid", "profile", "w_member_social"],
    async exchangeToken(code, redirectUri) {
      const clientId = getRequiredEnv("LINKEDIN_CLIENT_ID");
      const clientSecret = getRequiredEnv("LINKEDIN_CLIENT_SECRET");
      const response = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        },
      );

      return parseTokenResponse(response);
    },
    async fetchProfile(accessToken) {
      const response = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await response.json().catch(() => null)) as {
        sub?: string;
        name?: string;
        picture?: string;
      } | null;

      if (!response.ok || !payload?.sub) {
        throw new Error("Could not fetch LinkedIn account profile.");
      }

      return {
        providerAccountId: payload.sub,
        displayName: payload.name,
        avatarUrl: payload.picture,
        metadata: payload,
      };
    },
  },
};

export function getSocialProvider(platform: ConnectedAccountPlatform) {
  return socialProviders[platform];
}

export function createOAuthState(platform: ConnectedAccountPlatform): OAuthState {
  const provider = getSocialProvider(platform);

  return {
    platform,
    state: randomBytes(24).toString("base64url"),
    codeVerifier: provider.usePkce
      ? randomBytes(48).toString("base64url")
      : undefined,
  };
}

export function serializeOAuthState(state: OAuthState) {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

export function parseOAuthState(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as OAuthState;

    if (
      !connectedAccountPlatforms.includes(parsed.platform) ||
      typeof parsed.state !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createAuthorizationUrl(
  platform: ConnectedAccountPlatform,
  state: OAuthState,
) {
  const provider = getSocialProvider(platform);
  const { clientId, redirectUri } = getClientCredentials(provider);
  const url = new URL(provider.authorizationUrl);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", provider.scopes.join(" "));
  url.searchParams.set("state", state.state);

  if (provider.usePkce && state.codeVerifier) {
    url.searchParams.set(
      "code_challenge",
      createCodeChallenge(state.codeVerifier),
    );
    url.searchParams.set("code_challenge_method", "S256");
  }

  return url;
}

export function getTokenExpiry(expiresIn?: number) {
  if (!expiresIn || !Number.isFinite(expiresIn)) {
    return null;
  }

  return new Date(Date.now() + expiresIn * 1000);
}
