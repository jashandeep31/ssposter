export const supportedPlatforms = ["x", "linkedin"] as const;

export type SupportedPlatform = (typeof supportedPlatforms)[number];
export type MediaKind = "image" | "video";

export type MediaGuidelineItem = {
  id: string;
  contentType: string;
};

type PlatformMediaGuideline = {
  label: string;
  media: Partial<
    Record<
      MediaKind,
      {
        max: number;
      }
    >
  >;
  allowMixedMedia: boolean;
};

export const allowedMediaContentTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
] as const;

export type AllowedMediaContentType = (typeof allowedMediaContentTypes)[number];

const platformMediaGuidelines = {
  x: {
    label: "X",
    media: {
      image: { max: 4 },
      video: { max: 1 },
    },
    allowMixedMedia: false,
  },
  linkedin: {
    label: "LinkedIn",
    media: {
      image: { max: 20 },
      video: { max: 1 },
    },
    allowMixedMedia: false,
  },
} satisfies Record<SupportedPlatform, PlatformMediaGuideline>;

export function isSupportedPlatform(
  platform: string,
): platform is SupportedPlatform {
  return supportedPlatforms.includes(platform as SupportedPlatform);
}

export function isAllowedMediaContentType(
  contentType: string,
): contentType is AllowedMediaContentType {
  return allowedMediaContentTypes.includes(contentType as AllowedMediaContentType);
}

export function getMediaKind(contentType: string): MediaKind | null {
  if (contentType.startsWith("image/")) {
    return "image";
  }

  if (contentType.startsWith("video/")) {
    return "video";
  }

  return null;
}

export function getMediaSelectionLimit(platforms: SupportedPlatform[]) {
  if (platforms.length === 0) {
    return null;
  }

  return platforms.reduce<number | null>((currentLimit, platform) => {
    const imageLimit = platformMediaGuidelines[platform].media.image?.max ?? 0;

    if (currentLimit === null) {
      return imageLimit;
    }

    return Math.min(currentLimit, imageLimit);
  }, null);
}

export function getMediaSelectionGuidance(platforms: SupportedPlatform[]) {
  const limit = getMediaSelectionLimit(platforms);

  if (limit === null) {
    return "Choose at least one platform before attaching media.";
  }

  const labels = platforms.map((platform) => platformMediaGuidelines[platform].label);
  const platformLabel =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;

  return `You can attach up to ${limit} ${limit === 1 ? "image" : "images"} for ${platformLabel}.`;
}

export function validateMediaSelection({
  platforms,
  media,
}: {
  platforms: SupportedPlatform[];
  media: MediaGuidelineItem[];
}) {
  if (media.length === 0) {
    return { ok: true } as const;
  }

  if (platforms.length === 0) {
    return {
      ok: false,
      error: "Choose at least one platform before attaching media.",
    } as const;
  }

  const kinds = new Set<MediaKind>();

  for (const item of media) {
    if (!isAllowedMediaContentType(item.contentType)) {
      return {
        ok: false,
        error: "Only JPG, PNG, and GIF images can be attached.",
      } as const;
    }

    const kind = getMediaKind(item.contentType);

    if (!kind) {
      return {
        ok: false,
        error: "That media type is not supported for publishing.",
      } as const;
    }

    kinds.add(kind);
  }

  if (kinds.size > 1) {
    return {
      ok: false,
      error: "Attach either images or one video, not mixed media.",
    } as const;
  }

  const [kind] = Array.from(kinds);

  for (const platform of platforms) {
    const guideline = platformMediaGuidelines[platform];
    const mediaLimit = guideline.media[kind];

    if (!mediaLimit) {
      return {
        ok: false,
        error: `${guideline.label} does not support this media type yet.`,
      } as const;
    }

    if (!guideline.allowMixedMedia && kinds.size > 1) {
      return {
        ok: false,
        error: `${guideline.label} does not support mixed media in one post.`,
      } as const;
    }

    if (media.length > mediaLimit.max) {
      return {
        ok: false,
        error: `${guideline.label} supports up to ${mediaLimit.max} ${kind}${
          mediaLimit.max === 1 ? "" : "s"
        } per post.`,
      } as const;
    }
  }

  return { ok: true } as const;
}
