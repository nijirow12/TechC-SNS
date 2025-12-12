'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ConnectionStatus {
    isConnected: boolean;
    message: string;
    timestamp?: string;
}

interface Vibe {
    id: number;
    created_at: string;
    content: string;
    user_name?: string;
}

export default function DatabaseTestPage() {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
        isConnected: false,
        message: '接続テスト中...',
    });
    const [vibes, setVibes] = useState<Vibe[]>([]);
    const [loading, setLoading] = useState(true);
    const [newVibe, setNewVibe] = useState('');
    const [userName, setUserName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // データベース接続テスト
    const testConnection = async () => {
        try {
            const { data, error } = await supabase
                .from('vibes')
                .select('count')
                .limit(1);

            if (error) {
                setConnectionStatus({
                    isConnected: false,
                    message: `接続エラー: ${error.message}`,
                    timestamp: new Date().toLocaleString('ja-JP'),
                });
            } else {
                setConnectionStatus({
                    isConnected: true,
                    message: 'データベース接続成功！',
                    timestamp: new Date().toLocaleString('ja-JP'),
                });
            }
        } catch (err) {
            setConnectionStatus({
                isConnected: false,
                message: `予期しないエラー: ${err}`,
                timestamp: new Date().toLocaleString('ja-JP'),
            });
        }
    };

    // Vibesデータを取得
    const fetchVibes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vibes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('データ取得エラー:', error);
            } else {
                setVibes(data || []);
            }
        } catch (err) {
            console.error('予期しないエラー:', err);
        } finally {
            setLoading(false);
        }
    };

    // 新しいVibeを追加
    const addVibe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVibe.trim()) return;

        setSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('vibes')
                .insert([
                    {
                        content: newVibe,
                        user_name: userName || 'Anonymous',
                    },
                ])
                .select();

            if (error) {
                alert(`エラー: ${error.message}`);
            } else {
                setNewVibe('');
                fetchVibes(); // リストを更新
            }
        } catch (err) {
            alert(`予期しないエラー: ${err}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Vibeを削除
    const deleteVibe = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;

        try {
            const { error } = await supabase.from('vibes').delete().eq('id', id);

            if (error) {
                alert(`削除エラー: ${error.message}`);
            } else {
                fetchVibes(); // リストを更新
            }
        } catch (err) {
            alert(`予期しないエラー: ${err}`);
        }
    };

    useEffect(() => {
        testConnection();
        fetchVibes();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* ヘッダー */}
                <div className="mb-8 text-center">
                    <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                        Supabase Database Test
                    </h1>
                    <p className="text-gray-300">データベース接続とCRUD操作の検証</p>
                </div>

                {/* 接続ステータス */}
                <div
                    className={`mb-8 p-6 rounded-2xl border ${connectionStatus.isConnected
                            ? 'bg-green-500/10 border-green-500/50'
                            : 'bg-red-500/10 border-red-500/50'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">
                                接続ステータス
                            </h2>
                            <p
                                className={
                                    connectionStatus.isConnected
                                        ? 'text-green-400'
                                        : 'text-red-400'
                                }
                            >
                                {connectionStatus.message}
                            </p>
                            {connectionStatus.timestamp && (
                                <p className="text-gray-400 text-sm mt-1">
                                    {connectionStatus.timestamp}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={testConnection}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            再テスト
                        </button>
                    </div>
                </div>

                {/* 新規投稿フォーム */}
                <div className="mb-8 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        新しいVibeを投稿
                    </h2>
                    <form onSubmit={addVibe} className="space-y-4">
                        <div>
                            <label className="block text-gray-300 mb-2">名前（任意）</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Anonymous"
                                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">
                                メッセージ <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={newVibe}
                                onChange={(e) => setNewVibe(e.target.value)}
                                placeholder="今の気分を共有しよう..."
                                rows={3}
                                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? '投稿中...' : '投稿する'}
                        </button>
                    </form>
                </div>

                {/* Vibesリスト */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">Vibes一覧</h2>
                        <button
                            onClick={fetchVibes}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm"
                        >
                            🔄 更新
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                            <p className="text-gray-400 mt-4">読み込み中...</p>
                        </div>
                    ) : vibes.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-lg">
                                まだVibesがありません
                            </p>
                            <p className="text-gray-500 text-sm mt-2">
                                最初の投稿をしてみましょう！
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {vibes.map((vibe) => (
                                <div
                                    key={vibe.id}
                                    className="p-4 bg-black/20 border border-white/10 rounded-lg hover:border-purple-500/50 transition-colors group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-purple-400 font-semibold">
                                                    {vibe.user_name || 'Anonymous'}
                                                </span>
                                                <span className="text-gray-500 text-sm">
                                                    {new Date(vibe.created_at).toLocaleString('ja-JP')}
                                                </span>
                                            </div>
                                            <p className="text-white">{vibe.content}</p>
                                        </div>
                                        <button
                                            onClick={() => deleteVibe(vibe.id)}
                                            className="ml-4 px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-sm transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            削除
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* フッター情報 */}
                <div className="mt-8 text-center text-gray-400 text-sm">
                    <p>
                        このページはSupabaseデータベースの接続テスト用MVPです
                    </p>
                    <p className="mt-1">
                        テーブル名: <code className="text-purple-400">vibes</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
