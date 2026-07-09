import { type SupportedPlatform } from "@/lib/media-guidelines";
import { linkedInPoster } from "@/lib/social-publishers/linkedin";
import {
  type PublishPostInput,
  type PublishPostResult,
  UnsupportedPlatformError,
} from "@/lib/social-publishers/types";

export async function publishPostToPlatform(
  platform: SupportedPlatform,
  input: PublishPostInput,
): Promise<PublishPostResult> {
  switch (platform) {
    case "linkedin":
      return linkedInPoster(input);
    case "x":
      throw new UnsupportedPlatformError(platform);
  }
}
