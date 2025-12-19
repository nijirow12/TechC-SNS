'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, getGameRoom, getPlayers, subscribeToRoom, calculateSidePots, getSidePots, createSidePots } from '@/lib/supabase/poker';
import type { GameRoom, Player, GameAction, SidePot, PotWinnerSelection } from '@/lib/types/poker';
import PlayerCard from '@/components/poker/PlayerCard';
import ActionPanel from '@/components/poker/ActionPanel';
import PotDisplay from '@/components/poker/PotDisplay';
import PokerMat from '@/components/poker/PokerMat';

import WinnerSelector from '@/components/poker/WinnerSelector';
import CoinTransfer from '@/components/poker/CoinTransfer';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = params.roomCode as string;

    const [room, setRoom] = useState<GameRoom | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [sidePots, setSidePots] = useState<SidePot[]>([]);
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showWinnerSelect, setShowWinnerSelect] = useState(false);
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        const playerId = localStorage.getItem('player_id');
        const isHostUser = localStorage.getItem('is_host') === 'true';
        setCurrentPlayerId(playerId);
        setIsHost(isHostUser);

        let unsubscribe: (() => void) | null = null;

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
            unsubscribe = subscribeToRoom(
                roomData.id,
                (updatedRoom) => {
                    console.log('📡 Room state updated');
                    setRoom(updatedRoom);
                },
                (updatedPlayers) => {
                    console.log('📡 Players state updated');
                    setPlayers(updatedPlayers);
                },
                (action) => console.log('📡 New action:', action)
            );
        };

        initializeRoom();

        // クリーンアップ
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [roomCode]);

    const handleCalculateSidePots = async () => {
        if (!room) return;

        const pots = await calculateSidePots(room.id);

        // データベースに保存
        const saved = await createSidePots(room.id, room.current_round, pots);
        if (!saved) {
            alert('サイドポットの作成に失敗しました');
            return;
        }

        setSidePots(pots);
        setShowWinnerSelect(true);
    };

    const handleDistributePot = async (selections: PotWinnerSelection[]) => {
        if (!room) return;

        try {
            const response = await fetch('/api/rounds/distribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_id: room.id, pot_winners: selections }),
            });

            const data = await response.json();
            if (data.success) {
                setShowWinnerSelect(false);
                setSidePots([]);
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

            {/* ポーカーマット (ホストのみ) */}
            {isHost && (
                <PokerMat
                    players={players}
                    room={room}
                    currentPlayerId={currentPlayerId}
                    isHost={isHost}
                />
            )}

            {/* 参加者へのメッセージ (参加者のみ) */}
            {!isHost && (
                <div className="max-w-6xl mx-auto mb-6 text-center">
                    <div className="p-4 bg-slate-800/30 rounded-xl">
                        <p className="text-slate-400">ポーカーマットはホスト画面で確認してください</p>
                    </div>
                </div>
            )}

            {/* ゲーム開始ボタン（waiting状態かつホストのみ） */}
            {isHost && room.status === 'waiting' && (
                <div className="max-w-6xl mx-auto mb-6">
                    <div className="p-6 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm rounded-2xl border border-emerald-500/30">
                        <h3 className="text-xl font-bold mb-4 text-emerald-300">🎮 ゲーム開始</h3>
                        <p className="text-sm text-slate-300 mb-4">
                            準備ができたらゲームを開始してください。座席1と2のプレイヤーが自動的にSB/BBになります。
                        </p>
                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch('/api/blinds/collect', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ room_id: room.id }),
                                    });
                                    const data = await response.json();
                                    if (!data.success) {
                                        alert(data.error || 'ゲーム開始に失敗しました');
                                    }
                                } catch (err) {
                                    alert('サーバーエラーが発生しました');
                                }
                            }}
                            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg"
                        >
                            🎮 ゲーム開始！
                        </button>
                    </div>
                </div>
            )}

            {/* アクションパネル (プレイヤーかつ非ホスト、ゲーム中のみ) */}
            {!isHost && currentPlayer && room.status === 'playing' && (
                <ActionPanel
                    player={currentPlayer}
                    room={room}
                    players={players}
                    onActionComplete={() => { }}
                />
            )}

            {/* 待機メッセージ (プレイヤーかつ非ホスト、待機中) */}
            {!isHost && room.status === 'waiting' && (
                <div className="max-w-6xl mx-auto mb-6 text-center">
                    <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 animate-pulse">
                        <p className="text-xl font-semibold text-emerald-400">ホストがゲームを開始するのを待っています...</p>
                    </div>
                </div>
            )}

            {/* ラウンド管理 (ホストのみ) */}
            {isHost && (
                <div className="max-w-6xl mx-auto mt-6">
                    <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
                        <h3 className="text-lg font-semibold mb-4 text-teal-400">ラウンド管理</h3>
                        <button
                            onClick={handleCalculateSidePots}
                            className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                        >
                            🏆 ラウンド終了 - 勝者を選択
                        </button>
                    </div>
                </div>
            )}

            {/* 勝者選択モーダル (ホストのみ) */}
            {isHost && showWinnerSelect && sidePots.length > 0 && (
                <WinnerSelector
                    sidePots={sidePots}
                    players={players}
                    dealerPosition={room.dealer_position}
                    onSelectWinners={handleDistributePot}
                    onCancel={() => {
                        setShowWinnerSelect(false);
                        setSidePots([]);
                    }}
                />
            )}

            {/* コイン譲渡 (プレイヤーかつ非ホスト) */}
            {!isHost && currentPlayer && currentPlayerId && (
                <CoinTransfer
                    players={players}
                    currentPlayerId={currentPlayerId}
                    roomId={room.id}
                />
            )}
        </div>
    );
}
