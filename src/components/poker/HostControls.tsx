'use client';

import { useState } from 'react';
import type { Player, GameRoom } from '@/lib/types/poker';

interface HostControlsProps {
    players: Player[];
    room: GameRoom;
}

export default function HostControls({ players, room }: HostControlsProps) {
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleMovePlayer = async (playerId: string, newPosition: number) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        // 移動先に既にプレイヤーがいる場合は入れ替え
        const targetPlayer = players.find(p => p.position === newPosition);

        if (targetPlayer) {
            // 入れ替え
            try {
                const response = await fetch('/api/players/swap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        room_id: room.id,
                        player1_id: playerId,
                        player2_id: targetPlayer.id,
                    }),
                });

                const data = await response.json();
                if (!data.success) {
                    alert(data.error || '座席の入れ替えに失敗しました');
                }
            } catch (err) {
                alert('サーバーエラーが発生しました');
            }
        } else {
            // 空席に移動
            try {
                const response = await fetch('/api/players/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        player_id: playerId,
                        new_position: newPosition,
                    }),
                });

                const data = await response.json();
                if (!data.success) {
                    alert(data.error || '座席の移動に失敗しました');
                }
            } catch (err) {
                alert('サーバーエラーが発生しました');
            }
        }
        setSelectedPlayer(null);
    };

    const handleSetBlind = async (position: number, blindType: 'sb' | 'bb') => {
        const updates: any = {};

        if (blindType === 'sb') {
            updates.sb_position = position;
            updates.bb_position = room.bb_position; // 既存のBBを維持
        } else {
            updates.sb_position = room.sb_position; // 既存のSBを維持
            updates.bb_position = position;
        }

        try {
            const response = await fetch('/api/blinds/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: room.id,
                    ...updates,
                }),
            });

            const data = await response.json();
            if (!data.success) {
                alert(data.error || 'ブラインド設定に失敗しました');
            }
        } catch (err) {
            alert('サーバーエラーが発生しました');
        }
    };

    if (!isExpanded) {
        return (
            <div className="max-w-6xl mx-auto mb-6">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors flex items-center justify-between"
                >
                    <span className="text-slate-300 font-medium">⚙️ 座席・ブラインド管理</span>
                    <span className="text-slate-400">▼</span>
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto mb-6">
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-teal-400">⚙️ 座席・ブラインド管理</h3>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-slate-400 hover:text-slate-300"
                    >
                        ▲ 閉じる
                    </button>
                </div>

                {/* プレイヤー一覧 */}
                <div className="space-y-3">
                    {players.map((player) => (
                        <div
                            key={player.id}
                            className="p-4 bg-slate-900/50 rounded-xl border border-slate-600"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-bold text-white">{player.nickname}</p>
                                    <p className="text-sm text-slate-400">
                                        現在: 座席 {player.position + 1}
                                        {room.sb_position === player.position && ' (SB)'}
                                        {room.bb_position === player.position && ' (BB)'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                >
                                    {selectedPlayer === player.id ? 'キャンセル' : '移動'}
                                </button>
                            </div>

                            {/* 移動先選択 */}
                            {selectedPlayer === player.id && (
                                <div className="mt-3 pt-3 border-t border-slate-600">
                                    <p className="text-sm text-slate-400 mb-2">移動先を選択:</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Array.from({ length: room.max_players }).map((_, index) => {
                                            const targetPlayer = players.find(p => p.position === index);
                                            const isCurrent = player.position === index;

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => handleMovePlayer(player.id, index)}
                                                    disabled={isCurrent}
                                                    className={`py-2 px-3 rounded-lg transition-colors ${isCurrent
                                                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                            : targetPlayer
                                                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                >
                                                    座席 {index + 1}
                                                    {targetPlayer && ` (${targetPlayer.nickname}と入替)`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* SB/BB設定 */}
                            <div className="mt-3 pt-3 border-t border-slate-600">
                                <p className="text-sm text-slate-400 mb-2">ブラインド設定:</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSetBlind(player.position, 'sb')}
                                        className={`flex-1 py-2 px-3 rounded-lg transition-colors ${room.sb_position === player.position
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700 hover:bg-purple-600 text-slate-300 hover:text-white'
                                            }`}
                                    >
                                        {room.sb_position === player.position ? '✓ SB' : 'SBに設定'}
                                    </button>
                                    <button
                                        onClick={() => handleSetBlind(player.position, 'bb')}
                                        className={`flex-1 py-2 px-3 rounded-lg transition-colors ${room.bb_position === player.position
                                                ? 'bg-pink-600 text-white'
                                                : 'bg-slate-700 hover:bg-pink-600 text-slate-300 hover:text-white'
                                            }`}
                                    >
                                        {room.bb_position === player.position ? '✓ BB' : 'BBに設定'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {players.length === 0 && (
                    <p className="text-center text-slate-400 py-8">プレイヤーがいません</p>
                )}
            </div>
        </div>
    );
}
