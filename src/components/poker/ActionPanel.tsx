'use client';

import { useState } from 'react';
import type { Player, GameRoom } from '@/lib/types/poker';

interface ActionPanelProps {
    player: Player;
    room: GameRoom;
    players: Player[]; // 全プレイヤー（コール額計算用）
    onActionComplete: () => void;
}

export default function ActionPanel({ player, room, players, onActionComplete }: ActionPanelProps) {
    const [betAmount, setBetAmount] = useState(room.big_blind || 20);
    const [isProcessing, setIsProcessing] = useState(false);

    const minBet = room.big_blind || 20;
    const maxBet = player.chips;

    // 固定額ボタンの値
    const quickAmounts = [50, 100, 500, 1000];

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

    const handleCall = async () => {
        // 全プレイヤーの最高ベット額を取得
        const maxBet = Math.max(...players.map(p => p.current_bet), 0);

        // コール額 = 最高ベット額 - 自分の現在のベット額
        const callAmount = maxBet - player.current_bet;

        if (callAmount <= 0) {
            // チェックと同じ
            handleCheck();
            return;
        }

        // 実際のコール額（チップ不足の場合はオールイン）
        const actualCallAmount = Math.min(callAmount, player.chips);

        setIsProcessing(true);
        try {
            const response = await fetch('/api/actions/bet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: player.id, amount: actualCallAmount }),
            });

            const data = await response.json();
            if (data.success) {
                onActionComplete();
            } else {
                alert(data.error || 'コールに失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRaise = async () => {
        if (betAmount <= 0 || betAmount > player.chips) {
            alert('無効な金額です');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/actions/raise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: player.id, amount: betAmount }),
            });

            const data = await response.json();
            if (data.success) {
                setBetAmount(minBet);
                onActionComplete();
            } else {
                alert(data.error || 'レイズに失敗しました');
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

    // 金額調整（固定額を加算）
    const adjustBet = (delta: number) => {
        const newAmount = Math.max(0, Math.min(betAmount + delta, maxBet));
        setBetAmount(newAmount);
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

                    {/* 金額表示 */}
                    <div className="mb-3">
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setBetAmount(Math.min(Math.max(val, 0), maxBet));
                            }}
                            min={0}
                            max={maxBet}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-500 rounded-lg text-center text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            disabled={isProcessing}
                        />
                    </div>

                    {/* 固定額調整ボタン（加算） */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        {quickAmounts.map((amount) => (
                            <button
                                key={`add-${amount}`}
                                onClick={() => adjustBet(amount)}
                                disabled={isProcessing || betAmount + amount > maxBet}
                                className="py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-medium rounded-lg transition-all"
                            >
                                +{amount}
                            </button>
                        ))}
                    </div>

                    {/* 固定額調整ボタン（減算） */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                        {quickAmounts.map((amount) => (
                            <button
                                key={`sub-${amount}`}
                                onClick={() => adjustBet(-amount)}
                                disabled={isProcessing || betAmount - amount < 0}
                                className="py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-medium rounded-lg transition-all"
                            >
                                −{amount}
                            </button>
                        ))}
                    </div>

                    {/* ベット/レイズ/オールインボタン */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={handleBet}
                            disabled={isProcessing || betAmount <= 0 || betAmount > maxBet}
                            className="py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold text-lg rounded-lg transition-all disabled:cursor-not-allowed"
                        >
                            {betAmount} ベット
                        </button>
                        <button
                            onClick={handleRaise}
                            disabled={isProcessing || betAmount <= 0 || betAmount > maxBet}
                            className="py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold text-lg rounded-lg transition-all disabled:cursor-not-allowed"
                        >
                            {betAmount} レイズ
                        </button>
                        <button
                            onClick={handleAllIn}
                            disabled={isProcessing || player.chips === 0}
                            className="py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold text-lg rounded-lg transition-all disabled:cursor-not-allowed"
                        >
                            オールイン
                        </button>
                    </div>
                </div>

                {/* クイックアクション */}
                <div className="grid grid-cols-3 gap-2">
                    {(() => {
                        const maxBet = Math.max(...players.map(p => p.current_bet), 0);
                        const callAmount = maxBet - player.current_bet;
                        const actualCallAmount = Math.min(callAmount, player.chips);

                        return (
                            <button
                                onClick={handleCall}
                                disabled={isProcessing || callAmount <= 0}
                                className="py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                            >
                                {callAmount > 0 ? `コール (${actualCallAmount})` : 'コール'}
                            </button>
                        );
                    })()}
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
                </div>
            </div>
        </div>
    );
}
