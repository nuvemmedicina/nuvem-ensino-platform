"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, Trash2, CornerDownRight } from "lucide-react";

type CommentUser = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
};

type Reply = {
  id: string;
  content: string;
  parentId: string;
  createdAt: string;
  user: CommentUser;
};

type Comment = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: CommentUser;
  replies: Reply[];
};

type Props = {
  lessonId: string;
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string | null;
};

function Avatar({ user }: { user: CommentUser }) {
  const initials = (user.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isStaff = user.role === "ADMIN" || user.role === "INSTRUCTOR";

  return (
    <div
      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-sans text-xs font-bold overflow-hidden ${
        isStaff ? "bg-primary text-white" : "bg-border text-muted"
      }`}
    >
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name ?? ""} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

function formatRelative(date: string): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(date));
}

export default function CommentSection({ lessonId, currentUserId, currentUserRole, currentUserName }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string | null } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isStaff = currentUserRole === "ADMIN" || currentUserRole === "INSTRUCTOR";

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?lessonId=${lessonId}`);
      if (res.ok) setComments(await res.json());
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchComments();
    setText("");
    setReplyTo(null);
    setReplyText("");
  }, [fetchComments]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content: text }),
      });
      if (res.ok) {
        const newComment: Comment = { ...(await res.json()), replies: [] };
        setComments((prev) => [...prev, newComment]);
        setText("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyTo || !replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content: replyText, parentId: replyTo.id }),
      });
      if (res.ok) {
        const newReply: Reply = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id ? { ...c, replies: [...c.replies, newReply] } : c
          )
        );
        setReplyTo(null);
        setReplyText("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(id: string, isReply: boolean, parentId?: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (isReply && parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId ? { ...c, replies: c.replies.filter((r) => r.id !== id) } : c
            )
          );
        } else {
          setComments((prev) => prev.filter((c) => c.id !== id));
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  const totalCount = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <div className="px-6 pb-8">
      <div className="border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background">
          <MessageCircle className="w-3.5 h-3.5 text-muted" />
          <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">
            Comentários
          </span>
          {totalCount > 0 && (
            <span className="font-sans text-[10px] text-muted bg-border/60 px-1.5 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>

        <div className="bg-surface">
          {/* Comment list */}
          {loading ? (
            <div className="px-4 py-6 text-center">
              <span className="font-sans text-xs text-muted animate-pulse">Carregando…</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="font-sans text-xs text-muted">Nenhum comentário ainda. Seja o primeiro!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {comments.map((comment) => (
                <div key={comment.id} className="px-4 py-4">
                  {/* Comment */}
                  <div className="flex gap-3">
                    <Avatar user={comment.user} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-sans text-xs font-semibold text-foreground">
                          {comment.user.name ?? "Aluno"}
                        </span>
                        {(comment.user.role === "ADMIN" || comment.user.role === "INSTRUCTOR") && (
                          <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {comment.user.role === "ADMIN" ? "Admin" : "Instrutor"}
                          </span>
                        )}
                        <span className="font-sans text-[10px] text-muted">
                          {formatRelative(comment.createdAt)}
                        </span>
                      </div>
                      <p className="font-sans text-sm text-foreground mt-1 leading-relaxed whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => {
                            setReplyTo(replyTo?.id === comment.id ? null : { id: comment.id, name: comment.user.name });
                            setReplyText("");
                          }}
                          className="font-sans text-[11px] text-muted hover:text-primary transition-colors"
                        >
                          Responder
                        </button>
                        {(comment.user.id === currentUserId || isStaff) && (
                          <button
                            onClick={() => deleteComment(comment.id, false)}
                            disabled={deletingId === comment.id}
                            className="font-sans text-[11px] text-muted hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 ml-11 flex flex-col gap-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <CornerDownRight className="w-3.5 h-3.5 text-muted/40 shrink-0 mt-1" />
                          <Avatar user={reply.user} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="font-sans text-xs font-semibold text-foreground">
                                {reply.user.name ?? "Aluno"}
                              </span>
                              {(reply.user.role === "ADMIN" || reply.user.role === "INSTRUCTOR") && (
                                <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {reply.user.role === "ADMIN" ? "Admin" : "Instrutor"}
                                </span>
                              )}
                              <span className="font-sans text-[10px] text-muted">
                                {formatRelative(reply.createdAt)}
                              </span>
                            </div>
                            <p className="font-sans text-sm text-foreground mt-1 leading-relaxed whitespace-pre-wrap break-words">
                              {reply.content}
                            </p>
                            {(reply.user.id === currentUserId || isStaff) && (
                              <button
                                onClick={() => deleteComment(reply.id, true, comment.id)}
                                disabled={deletingId === reply.id}
                                className="font-sans text-[11px] text-muted hover:text-red-500 transition-colors mt-1 disabled:opacity-40"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyTo?.id === comment.id && (
                    <form onSubmit={submitReply} className="mt-3 ml-11 flex gap-2">
                      <input
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Responder ${replyTo.name ?? ""}…`}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background font-sans text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !replyText.trim()}
                        className="px-3 py-2 rounded-lg bg-primary text-white font-sans text-xs font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        className="px-3 py-2 rounded-lg border border-border text-muted font-sans text-xs hover:text-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New comment form */}
          <div className="px-4 py-4 border-t border-border/60">
            <form onSubmit={submitComment} className="flex gap-2 items-start">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-sans text-xs font-bold bg-border text-muted">
                {(currentUserName ?? "?")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitComment(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="Deixe uma dúvida ou comentário… (Enter para enviar)"
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background font-sans text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  className="px-3 py-2 rounded-lg bg-primary text-white font-sans text-xs font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40 self-end"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
