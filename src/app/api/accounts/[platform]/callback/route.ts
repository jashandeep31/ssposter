import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db, schema } from "@/db";
import { isConnectedAccountPlatform } from "@/lib/connected-accounts";
import { encryptSecret } from "@/lib/secret-encryption";
import { getRequiredSession } from "@/lib/session";
import {
  getSocialProvider,
  getTokenExpiry,
  parseOAuthState,
} from "@/lib/social-providers";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const session = await getRequiredSession();
  const { platform } = await params;
  const accountsUrl = new URL(
    "/dashboard/accounts",
    process.env.BETTER_AUTH_URL ?? request.url,
  );

  if (!isConnectedAccountPlatform(platform)) {
    accountsUrl.searchParams.set("error", "unsupported-platform");
    return NextResponse.redirect(accountsUrl);
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const incomingState = requestUrl.searchParams.get("state");
  const providerError = requestUrl.searchParams.get("error");
  const cookieStore = await cookies();
  const stateCookieName = `account_oauth_${platform}`;
  const storedState = parseOAuthState(cookieStore.get(stateCookieName)?.value);

  cookieStore.delete(stateCookieName);

  if (providerError) {
    accountsUrl.searchParams.set("error", providerError);
    return NextResponse.redirect(accountsUrl);
  }

  if (!code || !incomingState || !storedState || incomingState !== storedState.state) {
    accountsUrl.searchParams.set("error", "invalid-oauth-state");
    return NextResponse.redirect(accountsUrl);
  }

  try {
    const provider = getSocialProvider(platform);
    const redirectUri = process.env[provider.redirectUriEnv];

    if (!redirectUri) {
      throw new Error(`${provider.redirectUriEnv} is required.`);
    }

    const token = await provider.exchangeToken(code, redirectUri, storedState);
    const profile = await provider.fetchProfile(token.access_token);
    const connectedAccountId = crypto.randomUUID();
    const now = new Date();

    await db
      .insert(schema.connectedAccount)
      .values({
        id: connectedAccountId,
        userId: session.user.id,
        platform,
        providerAccountId: profile.providerAccountId,
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        accessToken: encryptSecret(token.access_token),
        refreshToken: token.refresh_token
          ? encryptSecret(token.refresh_token)
          : null,
        tokenType: token.token_type,
        scope: token.scope,
        accessTokenExpiresAt: getTokenExpiry(token.expires_in),
        refreshTokenExpiresAt: getTokenExpiry(token.refresh_token_expires_in),
        status: "active",
        metadata: profile.metadata ? JSON.stringify(profile.metadata) : null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          schema.connectedAccount.userId,
          schema.connectedAccount.platform,
          schema.connectedAccount.providerAccountId,
        ],
        set: {
          displayName: profile.displayName,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          accessToken: encryptSecret(token.access_token),
          refreshToken: token.refresh_token
            ? encryptSecret(token.refresh_token)
            : null,
          tokenType: token.token_type,
          scope: token.scope,
          accessTokenExpiresAt: getTokenExpiry(token.expires_in),
          refreshTokenExpiresAt: getTokenExpiry(token.refresh_token_expires_in),
          status: "active",
          metadata: profile.metadata ? JSON.stringify(profile.metadata) : null,
          updatedAt: now,
        },
      });
  } catch (error) {
    console.error("Failed to connect publishing account", error);
    accountsUrl.searchParams.set("error", "connect-failed");
    return NextResponse.redirect(accountsUrl);
  }

  accountsUrl.searchParams.set("connected", platform);
  return NextResponse.redirect(accountsUrl);
}
