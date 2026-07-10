import { isAllowedMediaContentType } from "@/lib/media-guidelines";
import { getMediaObjectBytes } from "@/lib/r2";
import { decryptSecret } from "@/lib/secret-encryption";
import {
  type PublishPostInput,
  type PublishPostResult,
  SocialPublishError,
} from "@/lib/social-publishers/types";

const linkedInApiVersion = process.env.LINKEDIN_API_VERSION ?? "202606";

type LinkedInImageInitializeResponse = {
  value?: {
    uploadUrl?: string;
    image?: string;
  };
};

function getLinkedInHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": linkedInApiVersion,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500;
}

async function getLinkedInErrorMessage(response: Response) {
  const payload = await response.text().catch(() => "");

  if (!payload) {
    return `LinkedIn request failed with status ${response.status}.`;
  }

  return `LinkedIn request failed with status ${response.status}: ${payload.slice(0, 400)}`;
}

async function initializeImageUpload({
  accessToken,
  owner,
}: {
  accessToken: string;
  owner: string;
}) {
  const response = await fetch(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      method: "POST",
      headers: {
        ...getLinkedInHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new SocialPublishError(await getLinkedInErrorMessage(response), {
      retryable: isRetryableStatus(response.status),
      status: response.status,
    });
  }

  const payload = (await response.json().catch(() => null)) as
    | LinkedInImageInitializeResponse
    | null;
  const uploadUrl = payload?.value?.uploadUrl;
  const image = payload?.value?.image;

  if (!uploadUrl || !image) {
    throw new SocialPublishError("LinkedIn did not return an image upload URL.", {
      retryable: true,
    });
  }

  return { uploadUrl, image };
}

async function uploadImage({
  accessToken,
  uploadUrl,
  contentType,
  bytes,
}: {
  accessToken: string;
  uploadUrl: string;
  contentType: string;
  bytes: Buffer;
}) {
  const body = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    body,
  });

  if (!response.ok) {
    throw new SocialPublishError(await getLinkedInErrorMessage(response), {
      retryable: isRetryableStatus(response.status),
      status: response.status,
    });
  }
}

async function uploadPostImage({
  accessToken,
  owner,
  objectKey,
  contentType,
}: {
  accessToken: string;
  owner: string;
  objectKey: string;
  contentType: string;
}) {
  const bytes = await getMediaObjectBytes(objectKey);
  const { uploadUrl, image } = await initializeImageUpload({
    accessToken,
    owner,
  });

  await uploadImage({
    accessToken,
    uploadUrl,
    contentType,
    bytes,
  });

  return image;
}

function getAltText(displayName: string) {
  return displayName.trim().slice(0, 120) || undefined;
}

async function createLinkedInPost({
  accessToken,
  body,
}: {
  accessToken: string;
  body: Record<string, unknown>;
}) {
  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      ...getLinkedInHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new SocialPublishError(await getLinkedInErrorMessage(response), {
      retryable: isRetryableStatus(response.status),
      status: response.status,
    });
  }

  const providerPostId = response.headers.get("x-restli-id");

  if (!providerPostId) {
    throw new SocialPublishError("LinkedIn did not return a post id.", {
      retryable: true,
    });
  }

  return providerPostId;
}

export async function linkedInPoster({
  content,
  account,
  media,
}: PublishPostInput): Promise<PublishPostResult> {
  if (media.length > 20) {
    throw new SocialPublishError("LinkedIn supports up to 20 images per post.", {
      retryable: false,
    });
  }

  for (const item of media) {
    if (!isAllowedMediaContentType(item.contentType)) {
      throw new SocialPublishError(
        "LinkedIn publishing only supports JPG, PNG, and GIF images.",
        { retryable: false },
      );
    }
  }

  const accessToken = decryptSecret(account.accessToken);
  const author = `urn:li:person:${account.providerAccountId}`;
  const imageUrns = await Promise.all(
    media.map((item) =>
      uploadPostImage({
        accessToken,
        owner: author,
        objectKey: item.objectKey,
        contentType: item.contentType,
      }),
    ),
  );
  const body: Record<string, unknown> = {
    author,
    commentary: content,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (imageUrns.length === 1) {
    body.content = {
      media: {
        id: imageUrns[0],
      },
    };
  } else if (imageUrns.length > 1) {
    body.content = {
      multiImage: {
        images: imageUrns.map((id, index) => ({
          id,
          altText: getAltText(media[index].displayName),
        })),
      },
    };
  }

  return {
    providerPostId: await createLinkedInPost({
      accessToken,
      body,
    }),
  };
}
