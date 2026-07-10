import { connectedAccount } from "@/db/schema";

export type ConnectedAccountRow = typeof connectedAccount.$inferSelect;

export type PublishableMedia = {
  id: string;
  objectKey: string;
  displayName: string;
  contentType: string;
  sizeBytes: number;
};

export type PublishPostInput = {
  postId: string;
  content: string;
  userId: string;
  account: ConnectedAccountRow;
  media: PublishableMedia[];
};

export type PublishPostResult = {
  providerPostId: string;
};

export class SocialPublishError extends Error {
  retryable: boolean;
  status?: number;

  constructor(message: string, options?: { retryable?: boolean; status?: number }) {
    super(message);
    this.name = "SocialPublishError";
    this.retryable = options?.retryable ?? false;
    this.status = options?.status;
  }
}

export class UnsupportedPlatformError extends SocialPublishError {
  constructor(platform: string) {
    super(`${platform} publishing is not implemented yet.`, {
      retryable: false,
    });
    this.name = "UnsupportedPlatformError";
  }
}
