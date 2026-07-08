"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImageIcon, Loader2, Plus } from "lucide-react";

import { getSignedMediaReadUrl } from "@/app/dashboard/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getMediaSelectionGuidance,
  isSupportedPlatform,
  validateMediaSelection,
  type SupportedPlatform,
} from "@/lib/media-guidelines";
import { cn } from "@/lib/utils";

export type MediaPickerItem = {
  id: string;
  displayName: string;
  fileName: string;
  contentType: string;
};

type MediaPickerDialogProps = {
  media: MediaPickerItem[];
};

type ThumbnailState = {
  readUrl?: string;
  error?: string;
};

export function MediaPickerDialog({ media }: MediaPickerDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    SupportedPlatform[]
  >(["x"]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, ThumbnailState>>(
    {},
  );

  function readSelectedPlatforms() {
    const form = containerRef.current?.closest("form");
    const platformInputs = Array.from(
      form?.querySelectorAll<HTMLInputElement>(
        'input[name="platforms"]:checked',
      ) ?? [],
    );

    return platformInputs.map((input) => input.value).filter(isSupportedPlatform);
  }

  function getMediaByIds(mediaIds: string[]) {
    return media.filter((item) => mediaIds.includes(item.id));
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const missingMedia = media.filter((item) => !thumbnails[item.id]);

    if (missingMedia.length === 0) {
      return;
    }

    let cancelled = false;

    Promise.all(
      missingMedia.map(async (item) => {
        const result = await getSignedMediaReadUrl(item.id);

        return {
          id: item.id,
          thumbnail: result.ok
            ? { readUrl: result.readUrl }
            : { error: result.error },
        };
      }),
    ).then((results) => {
      if (cancelled) {
        return;
      }

      setThumbnails((current) => ({
        ...current,
        ...Object.fromEntries(
          results.map((result) => [result.id, result.thumbnail]),
        ),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [media, open, thumbnails]);

  useEffect(() => {
    const form = containerRef.current?.closest("form");

    function syncSelectedPlatforms() {
      setSelectedPlatforms(readSelectedPlatforms());
    }

    syncSelectedPlatforms();
    form?.addEventListener("change", syncSelectedPlatforms);

    return () => {
      form?.removeEventListener("change", syncSelectedPlatforms);
    };
  }, []);

  const selectedMedia = media.filter((item) => selectedIds.includes(item.id));
  const draftSelectedMedia = getMediaByIds(draftSelectedIds);
  const selectedValidation = validateMediaSelection({
    platforms: selectedPlatforms,
    media: selectedMedia,
  });
  const draftValidation = validateMediaSelection({
    platforms: selectedPlatforms,
    media: draftSelectedMedia,
  });
  const guidance = getMediaSelectionGuidance(selectedPlatforms);
  const isLoadingThumbnails =
    open && media.some((item) => thumbnails[item.id] === undefined);

  function toggleMedia(mediaId: string) {
    setDraftSelectedIds((current) => {
      const nextIds = current.includes(mediaId)
        ? current.filter((item) => item !== mediaId)
        : [...current, mediaId];
      const validation = validateMediaSelection({
        platforms: selectedPlatforms,
        media: getMediaByIds(nextIds),
      });

      if (!validation.ok) {
        setMediaError(validation.error);
        return current;
      }

      setMediaError(null);
      return nextIds;
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setSelectedPlatforms(readSelectedPlatforms());
      setDraftSelectedIds(selectedIds);
      setMediaError(null);
    }

    setOpen(nextOpen);
  }

  function applySelectedMedia() {
    if (!draftValidation.ok) {
      setMediaError(draftValidation.error);
      return;
    }

    setSelectedIds(draftSelectedIds);
    setMediaError(null);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="mt-2 space-y-3">
      {selectedIds.map((mediaId) => (
        <input key={mediaId} type="hidden" name="mediaIds" value={mediaId} />
      ))}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add media
        </DialogTrigger>
        <DialogContent className="max-h-[min(760px,calc(100dvh-2rem))] overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle>Choose media</DialogTitle>
            <DialogDescription>
              {guidance} Videos are planned but not enabled yet.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-4 pb-4 sm:px-6">
            {mediaError || !draftValidation.ok ? (
              <p className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {mediaError || draftValidation.error}
              </p>
            ) : null}
            {isLoadingThumbnails ? (
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Loading thumbnails
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((item) => {
                const isSelected = draftSelectedIds.includes(item.id);
                const nextIds = isSelected
                  ? draftSelectedIds.filter((mediaId) => mediaId !== item.id)
                  : [...draftSelectedIds, item.id];
                const itemValidation = validateMediaSelection({
                  platforms: selectedPlatforms,
                  media: getMediaByIds(nextIds),
                });
                const isDisabled = !isSelected && !itemValidation.ok;
                const thumbnail = thumbnails[item.id];

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isSelected}
                    className={cn(
                      "group overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20",
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : "border-emerald-100",
                      isDisabled &&
                        "cursor-not-allowed opacity-50 hover:border-emerald-100 hover:shadow-sm",
                    )}
                    disabled={isDisabled}
                    onClick={() => toggleMedia(item.id)}
                  >
                    <div className="relative aspect-video bg-zinc-100">
                      {thumbnail?.readUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Signed R2 URLs are dynamic and short-lived.
                        <img
                          src={thumbnail.readUrl}
                          alt=""
                          className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                          {thumbnail?.error ? (
                            <ImageIcon className="size-8" aria-hidden="true" />
                          ) : (
                            <Loader2
                              className="size-6 animate-spin"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      )}
                      <span
                        className={cn(
                          "absolute right-2 top-2 flex size-6 items-center justify-center rounded-full border text-white transition",
                          isSelected
                            ? "border-emerald-500 bg-emerald-600"
                            : "border-white/80 bg-black/30 opacity-0 group-hover:opacity-100",
                        )}
                      >
                        <Check className="size-4" aria-hidden="true" />
                        <span className="sr-only">
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="break-all text-sm font-semibold text-zinc-950 sm:truncate">
                        {item.displayName}
                      </p>
                      <p className="mt-1 break-all text-xs text-zinc-500 sm:truncate">
                        {item.fileName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none border-emerald-100 bg-zinc-50 sm:px-6">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30 disabled:pointer-events-none disabled:opacity-60"
              onClick={applySelectedMedia}
              disabled={!draftValidation.ok}
            >
              Add {draftSelectedIds.length} {draftSelectedIds.length === 1 ? "file" : "files"}
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedMedia.length > 0 ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          <p className="font-medium">
            {selectedMedia.length} selected {selectedMedia.length === 1 ? "file" : "files"}
          </p>
          <p className="mt-1 break-all text-xs text-emerald-800/80 sm:truncate">
            {selectedMedia.map((item) => item.displayName).join(", ")}
          </p>
          {!selectedValidation.ok ? (
            <p className="mt-2 text-xs font-medium text-red-700">
              {selectedValidation.error}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">
          No media selected. Open the picker to attach uploaded files.
        </p>
      )}
    </div>
  );
}
