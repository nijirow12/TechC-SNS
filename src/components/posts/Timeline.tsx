'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getTimeline, subscribeToTimeline, TimelinePost } from '@/lib/supabase';
import PostCard from './PostCard';

export default function Timeline() {
    const { user } = useUser();
    const [posts, setPosts] = useState<TimelinePost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTimeline();

        // リアルタイム購読
        const channel = subscribeToTimeline((newPost) => {
            setPosts((prev) => [newPost, ...prev]);
        });

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const loadTimeline = async () => {
        try {
            const data = await getTimeline();
            setPosts(data);
        } catch (err) {
            console.error('タイムライン取得エラー:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePostDeleted = () => {
        loadTimeline();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">まだ投稿がありません</p>
                <p className="text-muted-foreground text-sm mt-2">最初の投稿をしてみましょう！</p>
            </div>
        );
    }

    return (
        <div>
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    onDelete={handlePostDeleted}
                />
            ))}
        </div>
    );
}
