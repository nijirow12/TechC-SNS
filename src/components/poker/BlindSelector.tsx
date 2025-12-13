'use client';

import { useState } from 'react';
import type { Player } from '@/lib/types/poker';

interface BlindSelectorProps {
    players: Player[];
    roomId: string;
    onBlindsSet: () => void;
    onStartGame: () => void;
}

export default function BlindSelector({ players, roomId, onBlindsSet, onStartGame }: BlindSelectorProps) {
    const [sbPosition, setSbPosition] = useState<number | null>(null);
    const [bbPosition, setBbPosition] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [blindsSet, setBlindsSet] = useState(false);

    const handleSetBlinds = async () => {
        if (sbPosition === null || bbPosition === null) {
            alert('SBとBBの両方を選択してください');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/blinds/set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_id: roomId, sb_position: sbPosition, bb_position: bbPosition }),
            });

            const data = await response.json();
            if (data.success) {
                setBlindsSet(true);
                onBlindsSet();
            } else {
                alert(data.error || 'ブラインド設定に失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartGame = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/blinds/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_id: roomId }),
            });

            const data = await response.json();
            if (data.success) {
                onStartGame();
            } else {
                alert(data.error || 'ゲーム開始に失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto mb-6">
            <div className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl border border-purple-500/30">
                <h3 className="text-xl font-bold mb-4 text-purple-300">🎲 ゲーム開始前の設定</h3>

                {!blindsSet ? (
                    <>
                        <p className="text-sm text-slate-300 mb-4">
                            スモールブラインド(SB)とビッグブラインド(BB)を選択してください
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* SB選択 */}
                            <div>
                                <label className="block text-sm font-medium text-purple-300 mb-2">
                                    スモールブラインド (SB)
                                </label>
                                <select
                                    value={sbPosition ?? ''}
                                    onChange={(e) => setSbPosition(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                    disabled={isProcessing}
                                >
                                    <option value="">プレイヤーを選択</option>
                                    {players.map((player) => (
                                        <option key={player.id} value={player.position}>
                                            {player.nickname} (座席 {player.position + 1})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* BB選択 */}
                            <div>
                                <label className="block text-sm font-medium text-pink-300 mb-2">
                                    ビッグブラインド (BB)
                                </label>
                                <select
                                    value={bbPosition ?? ''}
                                    onChange={(e) => setBbPosition(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-pink-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white"
                                    disabled={isProcessing}
                                >
                                    <option value="">プレイヤーを選択</option>
                                    {players.map((player) => (
                                        <option key={player.id} value={player.position}>
                                            {player.nickname} (座席 {player.position + 1})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleSetBlinds}
                            disabled={isProcessing || sbPosition === null || bbPosition === null}
                            className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    <span>設定中...</span>
                                </>
                            ) : (
                                'ブラインドを設定'
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="mb-4 p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                            <p className="text-green-300 font-semibold">✓ ブラインドが設定されました</p>
                        </div>
                        <button
                            onClick={handleStartGame}
                            disabled={isProcessing}
                            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                    <span>ゲーム開始中...</span>
                                </>
                            ) : (
                                '🎮 ゲーム開始！'
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
