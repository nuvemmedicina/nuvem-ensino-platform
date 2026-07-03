"use client";

import { useTransition } from "react";
import { Heart, Pin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { togglePostLike, togglePinPost, deleteForumPost } from "../actions";

type Props = {
  courseSlug: string;
  postId: string;
  likeCount: number;
  liked: boolean;
  isPinned: boolean;
  isModerator: boolean;
  isAuthor: boolean;
};

export function PostActions({ courseSlug, postId, likeCount, liked, isPinned, isModerator, isAuthor }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    startTransition(async () => {
      await togglePostLike(courseSlug, postId);
      router.refresh();
    });
  }

  function handlePin() {
    startTransition(async () => {
      await togglePinPost(courseSlug, postId);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Excluir este tópico e todas as respostas?")) return;
    startTransition(async () => {
      await deleteForumPost(courseSlug, postId);
      router.push(`/dashboard/cursos/${courseSlug}/forum`);
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleLike}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
          liked
            ? "border-red-300 text-red-500 bg-red-50"
            : "border-border text-muted hover:border-red-300 hover:text-red-400"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-400" : ""}`} />
        {likeCount} {likeCount === 1 ? "curtida" : "curtidas"}
      </button>

      {isModerator && (
        <button
          onClick={handlePin}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
            isPinned
              ? "border-amber-300 text-amber-600 bg-amber-50"
              : "border-border text-muted hover:border-amber-300 hover:text-amber-500"
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
          {isPinned ? "Desafixar" : "Fixar"}
        </button>
      )}

      {(isAuthor || isModerator) && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-muted hover:border-red-300 hover:text-red-500 transition-all ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir tópico
        </button>
      )}
    </div>
  );
}
