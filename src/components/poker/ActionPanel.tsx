'use client';

import { useState } from 'react';
import type { Player, GameRoom } from '@/lib/types/poker';

interface ActionPanelProps {
    player: Player;
    room: GameRoom;
    onActionComplete: () => void;
}

export default function ActionPanel({ player, room, onActionComplete }: ActionPanelProps) {
    const [betAmount, setBetAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleBet = async () => {
        const amount = parseInt(betAmount);
        if (!amount || amount <= 0 || amount > player.chips) {
            alert('無効な金額です');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/actions/bet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: player.id, amount }),
            });

            const data = await response.json();
            if (data.success) {
                setBetAmount('');
                onActionComplete();
            } else {
                alert(data.error || 'ベットに失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFold = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/actions/fold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: player.id }),
            });

            const data = await response.json();
            if (data.success) {
                onActionComplete();
            } else {
                alert(data.error || 'フォールドに失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCheck = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/actions/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: player.id }),
            });

            const data = await response.json();
            if (data.success) {
                onActionComplete();
            } else {
                alert(data.error || 'チェックに失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAllIn = async () => {
        if (player.chips === 0) return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/actions/bet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: player.id, amount: player.chips }),
            });

            const data = await response.json();
            if (data.success) {
                onActionComplete();
            } else {
                alert(data.error || 'オールインに失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    if (player.status === 'folded') {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 text-center">
                    <p className="text-slate-400">フォールド済み - 次のラウンドをお待ちください</p>
                </div>
            </div>
        );
    }

    if (player.status === 'all_in') {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 text-center">
                    <p className="text-yellow-400 font-semibold">オールイン！</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-emerald-400">あなたのアクション</h3>

                {/* ベット入力 */}
                <div className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            placeholder="ベット額"
                            min="1"
                            max={player.chips}
                            className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                            disabled={isProcessing}
                        />
                        <button
                            onClick={handleBet}
                            disabled={isProcessing || !betAmount}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                        >
                            ベット
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">残りチップ: {player.chips}</p>
                </div>

                {/* クイックアクション */}
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={handleCheck}
                        disabled={isProcessing}
                        className="py-3 px-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                        チェック
                    </button>
                    <button
                        onClick={handleFold}
                        disabled={isProcessing}
                        className="py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                        フォールド
                    </button>
                    <button
                        onClick={handleAllIn}
                        disabled={isProcessing || player.chips === 0}
                        className="py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                        オールイン
                    </button>
                </div>
            </div>
        </div>
    );
}
