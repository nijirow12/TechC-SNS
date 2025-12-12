'use client';

import { useState } from 'react';
import { TimelinePost } from '@/lib/supabase';
import { deletePost } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Trash2 } from 'lucide-react';

interface PostCardProps {
    post: TimelinePost;
    currentUserId?: string;
    onDelete?: () => void;
}

export default function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('この投稿を削除しますか？')) return;

        setDeleting(true);
        try {
            await deletePost(post.id);
            onDelete?.();
        } catch (err) {
            alert('削除に失敗しました');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'たった今';
        if (minutes < 60) return `${minutes}分前`;
        if (hours < 24) return `${hours}時間前`;
        if (days < 7) return `${days}日前`;
        return date.toLocaleDateString('ja-JP');
    };

    const isOwnPost = currentUserId === post.user_id;

    return (
        <Card className="hover:bg-accent/50 transition-colors border-0 border-b border-border shadow-none rounded-none first:rounded-t-md last:rounded-b-md">
            <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {post.avatar_url ? (
                            <img
                                src={post.avatar_url}
                                alt={post.display_name || post.username}
                                className="w-10 h-10 rounded-full bg-muted object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-medium text-sm border border-border">
                                {(post.display_name || post.username).charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-[15px]">
                                {post.display_name || post.username}
                            </span>
                            <span className="text-muted-foreground text-[14px]">
                                {formatDate(post.created_at)}
                            </span>
                        </div>

                        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed mb-3">{post.content}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-4 -ml-2">
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                                <Heart className="w-5 h-5" />
                                <span className="text-xs">{post.likes_count || 0}</span>
                            </Button>

                            {isOwnPost && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-xs">
                                        {deleting ? '...' : '削除'}
                                    </span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
