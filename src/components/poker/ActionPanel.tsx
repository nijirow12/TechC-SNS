'use client';

import { useState } from 'react';
import type { Player, GameRoom } from '@/lib/types/poker';

interface ActionPanelProps {
    player: Player;
    room: GameRoom;
    onActionComplete: () => void;
}

export default function ActionPanel({ player, room, onActionComplete }: ActionPanelProps) {
    const [betAmount, setBetAmount] = useState(room.big_blind || 20);
    const [isProcessing, setIsProcessing] = useState(false);

    const minBet = room.big_blind || 20;
    const maxBet = player.chips;

    const handleBet = async () => {
        if (betAmount <= 0 || betAmount > player.chips) {
            alert('無効な金額です');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/actions/bet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: player.id, amount: betAmount }),
            });

            const data = await response.json();
            if (data.success) {
                setBetAmount(minBet);
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

    // クイックベット金額を設定
    const setQuickBet = (percentage: number) => {
        const amount = Math.floor(player.chips * percentage);
        setBetAmount(Math.max(minBet, amount));
    };

    // 金額調整
    const adjustBet = (delta: number) => {
        const newAmount = betAmount + delta;
        if (newAmount >= minBet && newAmount <= maxBet) {
            setBetAmount(newAmount);
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

                {/* ベット入力セクション */}
                <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-400 text-sm">ベット額</span>
                        <span className="text-slate-400 text-sm">残り: <span className="text-emerald-400 font-semibold">{player.chips}</span></span>
                    </div>

                    {/* 金額表示と調整ボタン */}
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            onClick={() => adjustBet(-minBet)}
                            disabled={isProcessing || betAmount <= minBet}
                            className="w-12 h-12 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xl font-bold rounded-lg transition-all"
                        >
                            −
                        </button>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setBetAmount(Math.min(Math.max(val, 0), maxBet));
                            }}
                            min={minBet}
                            max={maxBet}
                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-500 rounded-lg text-center text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            disabled={isProcessing}
                        />
                        <button
                            onClick={() => adjustBet(minBet)}
                            disabled={isProcessing || betAmount >= maxBet}
                            className="w-12 h-12 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xl font-bold rounded-lg transition-all"
                        >
                            +
                        </button>
                    </div>

                    {/* クイックベットボタン */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                        <button
                            onClick={() => setQuickBet(0.25)}
                            disabled={isProcessing}
                            className="py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white text-sm font-medium rounded-lg transition-all"
                        >
                            25%
                        </button>
                        <button
                            onClick={() => setQuickBet(0.5)}
                            disabled={isProcessing}
                            className="py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white text-sm font-medium rounded-lg transition-all"
                        >
                            50%
                        </button>
                        <button
                            onClick={() => setQuickBet(0.75)}
                            disabled={isProcessing}
                            className="py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white text-sm font-medium rounded-lg transition-all"
                        >
                            75%
                        </button>
                        <button
                            onClick={() => setBetAmount(maxBet)}
                            disabled={isProcessing}
                            className="py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-800 text-white text-sm font-medium rounded-lg transition-all"
                        >
                            MAX
                        </button>
                    </div>

                    {/* ベットボタン */}
                    <button
                        onClick={handleBet}
                        disabled={isProcessing || betAmount <= 0 || betAmount > maxBet}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold text-lg rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                        {betAmount} チップをベット
                    </button>
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
