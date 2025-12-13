'use client';

import { useState } from 'react';
import type { Player, SidePot } from '@/lib/types/poker';

interface WinnerSelectorProps {
    sidePots: SidePot[];
    players: Player[];
    dealerPosition: number;
    onSelectWinners: (selections: { pot_index: number; winner_ids: string[] }[]) => void;
    onCancel: () => void;
}

export default function WinnerSelector({ sidePots, players, dealerPosition, onSelectWinners, onCancel }: WinnerSelectorProps) {
    const [currentPotIndex, setCurrentPotIndex] = useState(0);
    const [selections, setSelections] = useState<Map<number, Set<string>>>(new Map());
    const [isProcessing, setIsProcessing] = useState(false);

    const currentPot = sidePots[currentPotIndex];
    const isLastPot = currentPotIndex === sidePots.length - 1;
    const currentSelection = selections.get(currentPotIndex) || new Set<string>();

    const toggleWinner = (playerId: string) => {
        const newSelections = new Map(selections);
        const potSelection = new Set<string>(newSelections.get(currentPotIndex) || new Set<string>());

        if (potSelection.has(playerId)) {
            potSelection.delete(playerId);
        } else {
            potSelection.add(playerId);
        }

        newSelections.set(currentPotIndex, potSelection);
        setSelections(newSelections);
    };

    const handleNext = () => {
        if (currentSelection.size === 0) {
            alert('少なくとも1人の勝者を選択してください');
            return;
        }

        if (isLastPot) {
            // 最後のポット → 確認画面へ
            handleConfirm();
        } else {
            // 次のポットへ
            setCurrentPotIndex(currentPotIndex + 1);
        }
    };

    const handleBack = () => {
        if (currentPotIndex > 0) {
            setCurrentPotIndex(currentPotIndex - 1);
        }
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        const finalSelections = Array.from(selections.entries()).map(([pot_index, winner_ids]) => ({
            pot_index,
            winner_ids: Array.from(winner_ids),
        }));
        await onSelectWinners(finalSelections);
        setIsProcessing(false);
    };

    // 各勝者が受け取る額を計算
    const winnerCount = currentSelection.size;
    const baseAmount = winnerCount > 0 ? Math.floor(currentPot.amount / winnerCount) : 0;
    const remainder = winnerCount > 0 ? currentPot.amount % winnerCount : 0;

    // ディーラーに近い順にソート
    const sortedSelectedPlayers = players
        .filter(p => currentSelection.has(p.id))
        .sort((a, b) => {
            const distA = (a.position - dealerPosition + 6) % 6;
            const distB = (b.position - dealerPosition + 6) % 6;
            return distA - distB;
        });

    const getWinAmount = (playerId: string) => {
        const index = sortedSelectedPlayers.findIndex(p => p.id === playerId);
        const extraChip = index < remainder ? 1 : 0;
        return baseAmount + extraChip;
    };

    const potName = currentPot.pot_index === 0 ? 'メインポット' : `サイドポット${currentPot.pot_index}`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                {/* ヘッダー */}
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-white">🏆 {potName}</h2>
                        <span className="text-sm text-slate-400">{currentPotIndex + 1} / {sidePots.length}</span>
                    </div>
                    <p className="text-lg text-emerald-400 font-semibold mb-2">
                        ポット金額: {currentPot.amount}チップ
                    </p>
                    <p className="text-sm text-slate-400">このポットの勝者を選択してください（複数選択可）</p>

                    {currentSelection.size > 0 && (
                        <div className="mt-3 p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                            <p className="text-sm text-emerald-300">
                                選択中: <span className="font-bold">{currentSelection.size}人</span>
                            </p>
                            <p className="text-xs text-emerald-400 mt-1">
                                各自の獲得額: <span className="font-bold">{baseAmount}チップ</span>
                                {remainder > 0 && ` (+${remainder}人に1チップ追加)`}
                            </p>
                        </div>
                    )}
                </div>

                {/* プレイヤーリスト */}
                <div className="p-4 overflow-y-auto max-h-[50vh]">
                    <div className="space-y-2">
                        {players.map((player) => {
                            const isEligible = currentPot.eligible_player_ids.includes(player.id);
                            const isSelected = currentSelection.has(player.id);
                            const winAmount = isSelected ? getWinAmount(player.id) : 0;

                            return (
                                <button
                                    key={player.id}
                                    onClick={() => isEligible && toggleWinner(player.id)}
                                    disabled={!isEligible}
                                    className={`w-full p-4 rounded-xl transition-all duration-200 text-left border-2 ${!isEligible
                                        ? 'bg-slate-900/50 border-slate-700 opacity-50 cursor-not-allowed'
                                        : isSelected
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500'
                                            : 'bg-slate-700/50 hover:bg-slate-700 border-transparent hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            {/* チェックボックス */}
                                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                ? 'bg-white border-white'
                                                : 'bg-slate-600 border-slate-500'
                                                }`}>
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                                        {player.nickname}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded ${isSelected
                                                        ? 'bg-emerald-700 text-white'
                                                        : 'bg-slate-600 text-slate-300'
                                                        }`}>
                                                        座席 {player.position + 1}
                                                    </span>
                                                    {!isEligible && (
                                                        <span className="px-2 py-0.5 text-xs rounded bg-red-900/50 text-red-300">
                                                            参加不可
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className={isSelected ? 'text-emerald-100' : 'text-slate-400'}>
                                                        現在: <span className={`font-semibold ${isSelected ? 'text-white' : 'text-emerald-400'}`}>{player.chips}</span> チップ
                                                    </span>
                                                    {isSelected && (
                                                        <span className="text-yellow-200">
                                                            → <span className="font-bold text-yellow-100">+{winAmount}</span> 獲得
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* フッター */}
                <div className="p-4 border-t border-slate-700 space-y-2">
                    <div className="flex gap-2">
                        {currentPotIndex > 0 && (
                            <button
                                onClick={handleBack}
                                disabled={isProcessing}
                                className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-200"
                            >
                                ← 前のポット
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={currentSelection.size === 0 || isProcessing}
                            className={`flex-1 py-3 px-6 font-semibold rounded-xl transition-all duration-200 ${currentSelection.size > 0 && !isProcessing
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {isProcessing ? '処理中...' : isLastPot ? '決定' : '次のポット →'}
                        </button>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-200"
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    );
}
