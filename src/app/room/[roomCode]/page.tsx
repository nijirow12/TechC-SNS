'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, getGameRoom, getPlayers, subscribeToRoom } from '@/lib/supabase/poker';
import type { GameRoom, Player, GameAction } from '@/lib/types/poker';
import PlayerCard from '@/components/poker/PlayerCard';
import ActionPanel from '@/components/poker/ActionPanel';
import PotDisplay from '@/components/poker/PotDisplay';

import WinnerSelector from '@/components/poker/WinnerSelector';
import BlindSelector from '@/components/poker/BlindSelector';
import CoinTransfer from '@/components/poker/CoinTransfer';

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

    const handleDistributePot = async (winnerIds: string[]) => {
        if (!room) return;

        try {
            const response = await fetch('/api/rounds/distribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_id: room.id, winner_ids: winnerIds }),
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
                    {Array.from({ length: room.max_players }).map((_, index) => {
                        const player = players.find(p => p.position === index);
                        return (
                            <PlayerCard
                                key={index}
                                player={player}
                                position={index}
                                isDealer={room.dealer_position === index}
                                isCurrentPlayer={player?.id === currentPlayerId}
                                sbPosition={room.sb_position}
                                bbPosition={room.bb_position}
                            />
                        );
                    })}
                </div>
            </div>

            {/* ブラインド選択（ゲーム開始前のみ） */}
            {room.status === 'waiting' && (
                <BlindSelector
                    players={players}
                    roomId={room.id}
                    onBlindsSet={() => { }}
                    onStartGame={() => { }}
                />
            )}

            {/* アクションパネル */}
            {currentPlayer && (
                <ActionPanel
                    player={currentPlayer}
                    room={room}
                    onActionComplete={() => { }}
                />
            )}

            {/* ラウンド管理 */}
            <div className="max-w-6xl mx-auto mt-6">
                <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 text-teal-400">ラウンド管理</h3>
                    <button
                        onClick={() => setShowWinnerSelect(true)}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                    >
                        🏆 ラウンド終了 - 勝者を選択
                    </button>
                </div>
            </div>

            {/* 勝者選択モーダル */}
            {showWinnerSelect && (
                <WinnerSelector
                    players={players}
                    pot={room.current_pot}
                    dealerPosition={room.dealer_position}
                    onSelectWinners={handleDistributePot}
                    onCancel={() => setShowWinnerSelect(false)}
                />
            )}

            {/* コイン譲渡 */}
            {currentPlayer && currentPlayerId && (
                <CoinTransfer
                    players={players}
                    currentPlayerId={currentPlayerId}
                    roomId={room.id}
                />
            )}
        </div>
    );
}
