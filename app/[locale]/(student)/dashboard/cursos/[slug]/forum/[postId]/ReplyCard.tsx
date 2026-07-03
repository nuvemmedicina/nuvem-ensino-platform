"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, CheckCircle, Trash2, Award } from "lucide-react";
import { toggleReplyLike, toggleOfficialAnswer, deleteForumReply } from "../actions";

type Reply = {
  id: string;
  authorId: string;
  content: string;
  isOfficialAnswer: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string | null; image: string | null; role: string };
  likes: { id: string }[];
  _count: { likes: number };
};

type Props = {
  courseSlug: string;
  postId: string;
  reply: Reply;
  isModerator: boolean;
  isAuthor: boolean;
};

export function ReplyCard({ courseSlug, postId, reply, isModerator, isAuthor }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const liked = reply.likes.length > 0;
  const isReplyAuthorMod = reply.author.role === "ADMIN" || reply.author.role === "INSTRUCTOR";

  function handleLike() {
    startTransition(async () => {
      await toggleReplyLike(courseSlug, postId, reply.id);
      router.refresh();
    });
  }

  function handleOfficialAnswer() {
    startTransition(async () => {
      await toggleOfficialAnswer(courseSlug, postId, reply.id);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Excluir esta resposta?")) return;
    startTransition(async () => {
      await deleteForumReply(courseSlug, postId, reply.id);
      router.refresh();
    });
  }

  return (
    <div className={`bg-surface border rounded-2xl p-5 ${reply.isOfficialAnswer ? "border-green-400/50 bg-green-500/5" : "border-border"}`}>
      {reply.isOfficialAnswer && (
        <div className="flex items-center gap-2 mb-3 font-sans text-xs font-semibold text-green-600">
          <Award className="w-4 h-4" />
          Resposta oficial
        </div>
      )}

      {/* Autor */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
          {reply.author.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={reply.author.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-sans text-xs font-semibold text-primary">
              {reply.author.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div>
          <p className="font-sans text-sm font-medium text-foreground flex items-center gap-2">
            {reply.author.name ?? "Anônimo"}
            {isReplyAuthorMod && (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                {reply.author.role === "ADMIN" ? "Admin" : "Instrutor"}
              </span>
            )}
          </p>
          <p className="font-sans text-xs text-muted">
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(reply.createdAt))}
          </p>
        </div>
      </div>

      <p className="font-sans text-sm text-foreground leading-relaxed whitespace-pre-line mb-4">{reply.content}</p>

      {/* Ações */}
      <div className="flex items-center gap-2 flex-wrap">
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
          {reply._count.likes}
        </button>

        {isModerator && (
          <button
            onClick={handleOfficialAnswer}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              reply.isOfficialAnswer
                ? "border-green-400 text-green-600 bg-green-50"
                : "border-border text-muted hover:border-green-400 hover:text-green-600"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {reply.isOfficialAnswer ? "Remover oficial" : "Marcar oficial"}
          </button>
        )}

        {(isAuthor || isModerator) && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 font-sans text-xs text-muted hover:text-red-500 transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
