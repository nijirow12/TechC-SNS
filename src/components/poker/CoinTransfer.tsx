'use client';

import { useState, useEffect } from 'react';
import type { Player, CoinTransfer } from '@/lib/types/poker';

interface CoinTransferProps {
    players: Player[];
    currentPlayerId: string;
    roomId: string;
}

export default function CoinTransfer({ players, currentPlayerId, roomId }: CoinTransferProps) {
    const [toPlayerId, setToPlayerId] = useState('');
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [transfers, setTransfers] = useState<any[]>([]);

    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const otherPlayers = players.filter(p => p.id !== currentPlayerId);

    useEffect(() => {
        fetchTransfers();
    }, [roomId]);

    const fetchTransfers = async () => {
        try {
            const response = await fetch(`/api/transfers/history?room_id=${roomId}`);
            const data = await response.json();
            if (data.success) {
                setTransfers(data.transfers || []);
            }
        } catch (err) {
            console.error('Failed to fetch transfers:', err);
        }
    };

    const handleTransfer = async () => {
        const transferAmount = parseInt(amount);

        if (!toPlayerId) {
            alert('譲渡先のプレイヤーを選択してください');
            return;
        }

        if (!transferAmount || transferAmount <= 0) {
            alert('有効な金額を入力してください');
            return;
        }

        if (!currentPlayer || currentPlayer.chips < transferAmount) {
            alert('チップが不足しています');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/transfers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: roomId,
                    from_player_id: currentPlayerId,
                    to_player_id: toPlayerId,
                    amount: transferAmount,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setAmount('');
                setToPlayerId('');
                fetchTransfers();
            } else {
                alert(data.error || 'コイン譲渡に失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    const getPlayerName = (playerId: string) => {
        const player = players.find(p => p.id === playerId);
        return player?.nickname || '不明';
    };

    return (
        <div className="max-w-6xl mx-auto mt-6">
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-amber-400">💰 コイン譲渡</h3>
                <p className="text-xs text-slate-400 mb-4">
                    計算ミスなどの対応として、プレイヤー間でコインを譲渡できます
                </p>

                {/* 譲渡フォーム */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm text-slate-300 mb-2">譲渡先</label>
                            <select
                                value={toPlayerId}
                                onChange={(e) => setToPlayerId(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white text-sm"
                                disabled={isProcessing}
                            >
                                <option value="">プレイヤーを選択</option>
                                {otherPlayers.map((player) => (
                                    <option key={player.id} value={player.id}>
                                        {player.nickname} ({player.chips} チップ)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-300 mb-2">金額</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="譲渡額"
                                min="1"
                                max={currentPlayer?.chips || 0}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white text-sm"
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleTransfer}
                                disabled={isProcessing || !toPlayerId || !amount}
                                className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                        <span>送信中...</span>
                                    </>
                                ) : (
                                    '譲渡'
                                )}
                            </button>
                        </div>
                    </div>
                    {currentPlayer && (
                        <p className="text-xs text-slate-400 mt-2">
                            あなたの残高: {currentPlayer.chips} チップ
                        </p>
                    )}
                </div>

                {/* 譲渡履歴 */}
                {transfers.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">譲渡履歴</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {transfers.slice(0, 10).map((transfer) => (
                                <div
                                    key={transfer.id}
                                    className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-xs"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-300">
                                            {getPlayerName(transfer.from_player_id)} → {getPlayerName(transfer.to_player_id)}
                                        </span>
                                        <span className="text-amber-400 font-semibold">
                                            {transfer.amount} チップ
                                        </span>
                                    </div>
                                    <div className="text-slate-500 mt-1">
                                        {new Date(transfer.created_at).toLocaleString('ja-JP')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
