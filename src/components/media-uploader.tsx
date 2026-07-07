"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

import {
  createMediaUpload,
  registerUploadedMedia,
} from "@/app/dashboard/actions";

const allowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

type MediaUploaderProps = {
  maxUploadBytes: number;
};

function formatBytes(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${Math.round((value / (1024 * 1024)) * 10) / 10} MB`;
}

export function MediaUploader({ maxUploadBytes }: MediaUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage(null);

    if (!allowedContentTypes.includes(file.type)) {
      setMessage("Use a JPEG, PNG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > maxUploadBytes) {
      setMessage(`Use an image smaller than ${formatBytes(maxUploadBytes)}.`);
      event.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const upload = await createMediaUpload({
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });

      if (!upload.ok) {
        setMessage(upload.error);
        return;
      }

      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        setMessage("R2 rejected the upload. Check bucket CORS and credentials.");
        return;
      }

      const registered = await registerUploadedMedia({
        objectKey: upload.objectKey,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });

      if (!registered.ok) {
        setMessage(registered.error);
        return;
      }

      setMessage("Media uploaded.");
      event.target.value = "";
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Media upload failed", error);
      setMessage("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={allowedContentTypes.join(",")}
        className="sr-only"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30 disabled:pointer-events-none disabled:opacity-60"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading || isPending}
      >
        {isUploading || isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="size-4" aria-hidden="true" />
        )}
        {isUploading ? "Uploading..." : "Upload media"}
      </button>

      <p className="mt-2 text-xs text-zinc-500">
        JPEG, PNG, WebP, or GIF. Max {formatBytes(maxUploadBytes)}.
      </p>

      {message ? (
        <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
    </div>
  );
}
