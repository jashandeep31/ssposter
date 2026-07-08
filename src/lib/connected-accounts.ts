export const connectedAccountPlatforms = ["x", "linkedin"] as const;

export type ConnectedAccountPlatform =
  (typeof connectedAccountPlatforms)[number];

export function isConnectedAccountPlatform(
  platform: string,
): platform is ConnectedAccountPlatform {
  return connectedAccountPlatforms.includes(
    platform as ConnectedAccountPlatform,
  );
}
