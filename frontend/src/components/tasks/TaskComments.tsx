'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { TaskCommentRecord, UserRecord } from '@/lib/pocketbase-types';
import { MentionInput } from '@/components/ui/mention-input';
import { Loader2, Trash2, MessageSquare, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface TaskCommentsProps {
    taskId: string;
    taskTitle: string;
    projectKey: string;
}

function getTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `Vor ${diffMins} Min.`;
    if (diffHours < 24) return `Vor ${diffHours} Std.`;
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;
    return new Date(dateStr).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (c) => map[c] || c);
}

function formatContent(content: string): string {
    const escaped = escapeHtml(content);
    return escaped.replace(
        /@(\w[\w\s.-]*\w|\w)/g,
        '<span class="text-indigo-400 font-medium bg-indigo-500/10 px-1 rounded">@$1</span>'
    );
}

export function TaskComments({ taskId, taskTitle, projectKey }: TaskCommentsProps) {
    const [comments, setComments] = useState<TaskCommentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Get current user
    useEffect(() => {
        const user = pb.authStore.record;
        if (user) {
            setCurrentUser(user as unknown as UserRecord);
        }
    }, []);

    const fetchComments = useCallback(async () => {
        if (!taskId) return;
        setIsLoading(true);
        try {
            const result = await pb.collection('task_comments').getList(1, 100, {
                filter: pb.filter('task = {:tid}', { tid: taskId }),
                sort: 'created',
                expand: 'author',
            });
            setComments(result.items as TaskCommentRecord[]);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Auto-scroll to latest comment
    useEffect(() => {
        if (listRef.current && comments.length > 0) {
            const timer = setTimeout(() => {
                if (listRef.current) {
                    listRef.current.scrollTop = listRef.current.scrollHeight;
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [comments.length]);

    const handleSubmitComment = async () => {
        if (!newComment.trim() || !taskId || !currentUser) return;
        setIsSubmitting(true);

        try {
            const created = await pb.collection('task_comments').create({
                task: taskId,
                author: currentUser.id,
                content: newComment.trim(),
                mentions: mentionedUserIds.length > 0 ? mentionedUserIds : null,
            });

            // Fetch the created comment with author expand
            const commentWithAuthor = await pb.collection('task_comments').getOne(created.id, {
                expand: 'author',
            });

            setComments(prev => [...prev, commentWithAuthor as TaskCommentRecord]);
            setNewComment('');
            setMentionedUserIds([]);

            // Create notifications for mentioned users
            if (mentionedUserIds.length > 0) {
                await createMentionNotifications(mentionedUserIds, taskId, taskTitle, projectKey);
            }

            toast.success('Kommentar hinzugefügt');
        } catch (error) {
            console.error('Failed to create comment:', error);
            toast.error('Fehler beim Erstellen des Kommentars');
        } finally {
            setIsSubmitting(false);
        }
    };

    const createMentionNotifications = async (
        userIds: string[],
        taskId: string,
        taskTitle: string,
        projectKey: string
    ) => {
        const authorName = currentUser?.name || currentUser?.email || 'Jemand';
        const taskRef = `${projectKey}-${taskId.substring(0, 4).toUpperCase()}`;

        for (const userId of userIds) {
            // Skip notification for self-mentions
            if (userId === currentUser?.id) continue;

            try {
                await pb.collection('notifications').create({
                    user: userId,
                    type: 'task_mention',
                    title: `Erwähnung in ${taskRef}`,
                    message: `${authorName} hat dich in einem Kommentar zu "${taskTitle}" erwähnt`,
                    read: false,
                    link: `/tasks?task=${taskId}`,
                });
            } catch (error) {
                console.error('Failed to create mention notification:', error);
            }
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        setDeletingId(commentId);
        try {
            await pb.collection('task_comments').delete(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            toast.success('Kommentar gelöscht');
        } catch (error) {
            console.error('Failed to delete comment:', error);
            toast.error('Fehler beim Löschen des Kommentars');
        } finally {
            setDeletingId(null);
        }
    };

    const handleCommentChange = (value: string, mentionedIds: string[]) => {
        setNewComment(value);
        setMentionedUserIds(mentionedIds);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Submit on Ctrl+Enter or Cmd+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmitComment();
        }
    };

    return (
        <div className="space-y-4">
            {/* Comments List */}
            <div
                ref={listRef}
                className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <MessageSquare size={32} className="text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Keine Kommentare vorhanden</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Schreibe den ersten Kommentar zu dieser Aufgabe.
                        </p>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const author = comment.expand?.author;
                        const isOwn = currentUser?.id === comment.author;

                        return (
                            <div
                                key={comment.id}
                                className="flex gap-3 p-3 rounded-xl border border-border/50 bg-card/20 hover:bg-card/40 transition-colors group"
                            >
                                {/* Author Avatar */}
                                <div className="flex-shrink-0">
                                    {author?.avatar ? (
                                        <img
                                            src={pb.files?.getUrl(author, author.avatar) || ''}
                                            alt={author.name || 'Avatar'}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-medium">
                                            {(author?.name || author?.email || '?')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Comment Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-foreground">
                                            {author?.name || author?.email || 'Unbekannt'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {getTimeAgo(comment.created)}
                                        </span>
                                        {comment.mentions && comment.mentions.length > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] text-indigo-500/60">
                                                <AtSign size={10} />
                                                {comment.mentions.length}
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words"
                                        dangerouslySetInnerHTML={{ __html: formatContent(comment.content) }}
                                    />

                                    {/* Delete Button (own comments only) */}
                                    {isOwn && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            disabled={deletingId === comment.id}
                                            className="mt-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-all"
                                        >
                                            {deletingId === comment.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={12} />
                                            )}
                                            Löschen
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Comment Form */}
            {currentUser && (
                <div className="space-y-2 pt-3 border-t border-border/50">
                    <div className="flex items-start gap-3">
                        {/* Current User Avatar */}
                        <div className="flex-shrink-0 mt-1">
                            {currentUser?.avatar ? (
                                <img
                                    src={pb.files?.getUrl(currentUser, currentUser.avatar) || ''}
                                    alt={currentUser.name || 'Avatar'}
                                    className="w-7 h-7 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-400 font-medium">
                                    {(currentUser?.name || currentUser?.email || '?')[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-2">
                            <MentionInput
                                value={newComment}
                                onChange={handleCommentChange}
                                placeholder="Schreibe einen Kommentar... (@ für Erwähnungen)"
                                disabled={isSubmitting}
                                minRows={2}
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">
                                    Strg+Enter zum Absenden
                                </span>
                                <Button
                                    onClick={handleSubmitComment}
                                    disabled={isSubmitting || !newComment.trim()}
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={14} className="animate-spin mr-1" />
                                    ) : (
                                        <MessageSquare size={14} className="mr-1" />
                                    )}
                                    Senden
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!currentUser && (
                <p className="text-xs text-muted-foreground text-center py-2">
                    Melde dich an, um Kommentare zu schreiben.
                </p>
            )}
        </div>
    );
}
