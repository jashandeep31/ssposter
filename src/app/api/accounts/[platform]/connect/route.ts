import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isConnectedAccountPlatform } from "@/lib/connected-accounts";
import {
  createAuthorizationUrl,
  createOAuthState,
  serializeOAuthState,
} from "@/lib/social-providers";
import { getRequiredSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  await getRequiredSession();

  const { platform } = await params;

  if (!isConnectedAccountPlatform(platform)) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/accounts?error=unsupported-platform",
        process.env.BETTER_AUTH_URL ?? _request.url,
      ),
    );
  }

  const state = createOAuthState(platform);
  const cookieStore = await cookies();

  cookieStore.set(`account_oauth_${platform}`, serializeOAuthState(state), {
    httpOnly: true,
    maxAge: 10 * 60,
    path: `/api/accounts/${platform}`,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.redirect(createAuthorizationUrl(platform, state));
}
