'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createPost } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface PostComposerProps {
    onPostCreated?: () => void;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
    const { user } = useUser();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const maxLength = 280;
    const remaining = maxLength - content.length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || content.length > maxLength || !user) return;

        setLoading(true);
        setError(null);

        try {
            await createPost(content, user.id);
            setContent('');
            onPostCreated?.();
        } catch (err: any) {
            setError(err.message || '投稿に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-0 shadow-none rounded-none">
            <CardContent className="pt-4 pb-4 px-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="いまどうしてる？"
                        maxLength={maxLength}
                        rows={3}
                        className="resize-none border-0 focus-visible:ring-0 px-0 text-[15px]"
                    />

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span
                            className={`text-xs font-medium ${remaining < 20
                                ? 'text-red-500'
                                : remaining < 50
                                    ? 'text-yellow-500'
                                    : 'text-muted-foreground'
                                }`}
                        >
                            {remaining}
                        </span>

                        <Button
                            type="submit"
                            size="sm"
                            disabled={loading || !content.trim() || remaining < 0}
                            className="rounded-full"
                        >
                            {loading ? '投稿中...' : '投稿'}
                        </Button>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                            {error}
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
