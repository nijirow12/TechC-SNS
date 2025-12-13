'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, getGameRoom, getPlayers, subscribeToRoom } from '@/lib/supabase/poker';
import type { GameRoom, Player, GameAction } from '@/lib/types/poker';
import PlayerCard from '@/components/poker/PlayerCard';
import ActionPanel from '@/components/poker/ActionPanel';
import PotDisplay from '@/components/poker/PotDisplay';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = params.roomCode as string;

    const [room, setRoom] = useState<GameRoom | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showWinnerSelect, setShowWinnerSelect] = useState(false);

    useEffect(() => {
        const playerId = localStorage.getItem('player_id');
        setCurrentPlayerId(playerId);

        const initializeRoom = async () => {
            const roomData = await getGameRoom(roomCode);
            if (!roomData) {
                setError('ルームが見つかりません');
                setLoading(false);
                return;
            }

            setRoom(roomData);
            const playersData = await getPlayers(roomData.id);
            setPlayers(playersData);
            setLoading(false);

            // リアルタイムサブスクリプション
            const unsubscribe = subscribeToRoom(
                roomData.id,
                (updatedRoom) => setRoom(updatedRoom),
                (updatedPlayers) => setPlayers(updatedPlayers),
                (action) => console.log('New action:', action)
            );

            return () => unsubscribe();
        };

        initializeRoom();
    }, [roomCode]);

    const handleDistributePot = async (winnerId: string) => {
        if (!room) return;

        try {
            const response = await fetch('/api/rounds/distribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_id: room.id, winner_id: winnerId }),
            });

            const data = await response.json();
            if (data.success) {
                setShowWinnerSelect(false);
            } else {
                alert(data.error || 'ポット配分に失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || 'ルームが見つかりません'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        ホームに戻る
                    </button>
                </div>
            </div>
        );
    }

    const currentPlayer = players.find(p => p.id === currentPlayerId);

    return (
        <div className="min-h-screen p-4">
            {/* ヘッダー */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                    >
                        ← 退出
                    </button>
                    <div className="text-center">
                        <p className="text-sm text-slate-400">ルームコード</p>
                        <p className="text-2xl font-bold text-emerald-400">{roomCode}</p>
                    </div>
                    <div className="w-20"></div>
                </div>

                {/* ポット表示 */}
                <PotDisplay pot={room.current_pot} round={room.current_round} />
            </div>

            {/* プレイヤーグリッド */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, index) => {
                        const player = players.find(p => p.position === index);
                        return (
                            <PlayerCard
                                key={index}
                                player={player}
                                position={index}
                                isDealer={room.dealer_position === index}
                                isCurrentPlayer={player?.id === currentPlayerId}
                            />
                        );
                    })}
                </div>
            </div>

            {/* アクションパネル */}
            {currentPlayer && (
                <ActionPanel
                    player={currentPlayer}
                    room={room}
                    onActionComplete={() => { }}
                />
            )}

            {/* ラウンド管理（全プレイヤーが見える） */}
            <div className="max-w-6xl mx-auto mt-6">
                <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 text-teal-400">ラウンド管理</h3>
                    <button
                        onClick={() => setShowWinnerSelect(!showWinnerSelect)}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                    >
                        {showWinnerSelect ? 'キャンセル' : 'ラウンド終了 - 勝者を選択'}
                    </button>

                    {showWinnerSelect && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm text-slate-400 mb-2">勝者を選択してください:</p>
                            {players.filter(p => p.status !== 'folded').map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handleDistributePot(player.id)}
                                    className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                                >
                                    {player.nickname} (座席 {player.position + 1})
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
