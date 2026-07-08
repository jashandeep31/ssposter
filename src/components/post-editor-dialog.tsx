"use client";

import { BriefcaseBusiness, CalendarClock, Pencil, Send } from "lucide-react";

import { updatePost } from "@/app/dashboard/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MediaPickerDialog,
  type MediaPickerItem,
} from "@/components/media-picker-dialog";
import { SchedulePicker } from "@/components/schedule-picker";

type EditablePost = {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  publishDate: string;
  publishTime: string;
  mediaIds: string[];
};

type PostEditorDialogProps = {
  post: EditablePost;
  media: MediaPickerItem[];
};

export function PostEditorDialog({ post, media }: PostEditorDialogProps) {
  const updatePostWithId = updatePost.bind(null, post.id);

  return (
    <Dialog>
      <DialogTrigger
        type="button"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20"
      >
        <Pencil className="size-4" aria-hidden="true" />
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[min(860px,calc(100dvh-2rem))] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
          <DialogDescription>
            Update content, channels, media, or schedule. Drafts can be saved
            without a publish time.
          </DialogDescription>
        </DialogHeader>

        <form action={updatePostWithId} className="space-y-5">
          <div>
            <label
              htmlFor={`edit-post-content-${post.id}`}
              className="text-sm font-medium text-zinc-800"
            >
              Post content
            </label>
            <textarea
              id={`edit-post-content-${post.id}`}
              name="content"
              rows={8}
              maxLength={2800}
              required
              defaultValue={post.content}
              className="mt-2 min-h-40 w-full resize-y rounded-lg border border-emerald-100 bg-white px-3 py-3 text-sm leading-6 text-zinc-950 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-600/20"
            />
            <div className="mt-2 flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
              <p>Use line breaks for LinkedIn. Keep X posts concise.</p>
              <p>2,800 character limit</p>
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-zinc-800">
              Platforms
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-emerald-100 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-800">
                <input
                  type="checkbox"
                  name="platforms"
                  value="x"
                  defaultChecked={post.platforms.includes("x")}
                  className="size-4 accent-emerald-600"
                />
                <Send className="size-4 text-emerald-700" aria-hidden="true" />
                X
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-emerald-100 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-800">
                <input
                  type="checkbox"
                  name="platforms"
                  value="linkedin"
                  defaultChecked={post.platforms.includes("linkedin")}
                  className="size-4 accent-emerald-600"
                />
                <BriefcaseBusiness
                  className="size-4 text-emerald-700"
                  aria-hidden="true"
                />
                LinkedIn
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-zinc-800">Media</legend>
            {media.length > 0 ? (
              <MediaPickerDialog
                media={media}
                initialSelectedIds={post.mediaIds}
              />
            ) : (
              <p className="mt-2 rounded-lg bg-zinc-50 px-4 py-5 text-sm text-zinc-600">
                Upload media from the media library before attaching it to a
                post.
              </p>
            )}
          </fieldset>

          <SchedulePicker
            initialDate={post.publishDate}
            initialTime={post.publishTime}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-emerald-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="submit"
              name="intent"
              value="draft"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20 sm:w-auto"
            >
              Save draft
            </button>
            <button
              type="submit"
              name="intent"
              value="schedule"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30 sm:w-auto"
            >
              <CalendarClock className="size-4" aria-hidden="true" />
              Update schedule
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
