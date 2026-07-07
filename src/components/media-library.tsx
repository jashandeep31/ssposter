"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteMedia,
  getSignedMediaReadUrl,
  renameMedia,
} from "@/app/dashboard/actions";
import { MediaUploader } from "@/components/media-uploader";

export type MediaLibraryItem = {
  id: string;
  displayName: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

type MediaLibraryProps = {
  media: MediaLibraryItem[];
  maxUploadBytes: number;
  searchQuery?: string;
};

function formatBytes(value: number) {
  if (value <= 0) {
    return "Unknown size";
  }

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${Math.round((value / (1024 * 1024)) * 10) / 10} MB`;
}

function getMediaKind(contentType: string) {
  return contentType.replace("image/", "").toUpperCase();
}

export function MediaLibrary({
  media,
  maxUploadBytes,
  searchQuery = "",
}: MediaLibraryProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function beginRename(item: MediaLibraryItem) {
    setMessage(null);
    setConfirmingDeleteId(null);
    setEditingId(item.id);
    setEditingName(item.displayName);
  }

  function cancelRename() {
    setEditingId(null);
    setEditingName("");
  }

  function handleView(mediaId: string) {
    setPendingActionId(mediaId);
    setMessage(null);

    startTransition(async () => {
      const result = await getSignedMediaReadUrl(mediaId);
      setPendingActionId(null);

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      window.open(result.readUrl, "_blank", "noopener,noreferrer");
    });
  }

  function handleRename(mediaId: string) {
    const nextName = editingName.trim().replace(/\s+/g, " ");

    if (!nextName) {
      setMessage("Media name cannot be blank.");
      return;
    }

    if (nextName.length > 120) {
      setMessage("Media name must be 120 characters or less.");
      return;
    }

    setPendingActionId(mediaId);
    setMessage(null);

    startTransition(async () => {
      const result = await renameMedia(mediaId, nextName);
      setPendingActionId(null);

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      setEditingId(null);
      setEditingName("");
      router.refresh();
    });
  }

  function handleDelete(mediaId: string) {
    setPendingActionId(mediaId);
    setMessage(null);

    startTransition(async () => {
      const result = await deleteMedia(mediaId);
      setPendingActionId(null);

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      setConfirmingDeleteId(null);
      router.refresh();
    });
  }

  return (
    <section className="min-w-0 rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Library
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Media library
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Manage private R2 uploads. Files open through short-lived signed
            links and remain scoped to your account.
          </p>
        </div>
        <MediaUploader maxUploadBytes={maxUploadBytes} />
      </div>

      <form action="/dashboard/media" className="mt-6">
        <label htmlFor="media-search" className="sr-only">
          Search media
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              id="media-search"
              name="q"
              type="search"
              defaultValue={searchQuery}
              placeholder="Search by media name..."
              className="h-11 w-full rounded-lg border border-emerald-100 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-600/20"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20 sm:w-auto"
          >
            Search
          </button>
        </div>
      </form>

      {message ? (
        <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {media.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {media.map((item) => {
            const isBusy = isPending && pendingActionId === item.id;
            const isEditing = editingId === item.id;
            const isConfirmingDelete = confirmingDeleteId === item.id;

            return (
              <article
                key={item.id}
                className="min-w-0 overflow-hidden rounded-lg border border-emerald-100 bg-zinc-50 p-4"
              >
                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <label className="block min-w-0">
                        <span className="sr-only">Media name</span>
                        <input
                          value={editingName}
                          maxLength={120}
                          onChange={(event) =>
                            setEditingName(event.target.value)
                          }
                          className="h-10 w-full min-w-0 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-emerald-500 focus:ring-3 focus:ring-emerald-600/20"
                        />
                      </label>
                    ) : (
                      <h2 className="break-all text-sm font-semibold text-zinc-950 sm:truncate">
                        {item.displayName}
                      </h2>
                    )}
                    <p className="mt-1 break-all text-sm text-zinc-500 sm:truncate">
                      {item.fileName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>{getMediaKind(item.contentType)}</span>
                      <span>{formatBytes(item.sizeBytes)}</span>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30 disabled:pointer-events-none disabled:opacity-60"
                        onClick={() => handleRename(item.id)}
                        disabled={isBusy}
                      >
                        {isBusy ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Check className="size-4" aria-hidden="true" />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20"
                        onClick={cancelRename}
                      >
                        <X className="size-4" aria-hidden="true" />
                        Cancel
                      </button>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-600/30 disabled:pointer-events-none disabled:opacity-60"
                        onClick={() => handleDelete(item.id)}
                        disabled={isBusy}
                      >
                        {isBusy ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 className="size-4" aria-hidden="true" />
                        )}
                        Delete
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20"
                        onClick={() => setConfirmingDeleteId(null)}
                      >
                        <X className="size-4" aria-hidden="true" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20 disabled:pointer-events-none disabled:opacity-60"
                        onClick={() => handleView(item.id)}
                        disabled={isBusy}
                      >
                        {isBusy ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <ExternalLink
                            className="size-4"
                            aria-hidden="true"
                          />
                        )}
                        View
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20"
                        onClick={() => beginRename(item)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        Rename
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-600/20"
                        onClick={() => {
                          setEditingId(null);
                          setMessage(null);
                          setConfirmingDeleteId(item.id);
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 rounded-lg bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
          {searchQuery
            ? "No media matched your search."
            : "Uploaded media will appear here after R2 accepts the file."}
        </p>
      )}
    </section>
  );
}
