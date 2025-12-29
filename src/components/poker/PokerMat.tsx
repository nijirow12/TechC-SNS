'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { Player, GameRoom } from '@/lib/types/poker';

interface PokerMatProps {
    players: Player[];
    room: GameRoom;
    currentPlayerId: string | null;
    isHost: boolean;
}

// ドラッグ可能なプレイヤーカード
function DraggablePlayer({ player, children, disabled }: { player: Player; children: React.ReactNode; disabled: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `player-${player.id}`,
        data: { type: 'player', player },
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={isDragging ? 'opacity-50 cursor-grabbing' : disabled ? '' : 'cursor-grab hover:scale-105 transition-transform'}
        >
            {children}
        </div>
    );
}

// ドラッグ可能なSB/BBバッジ
function DraggableBadge({ type, position, children, disabled, isFloating = false }: { type: 'sb' | 'bb'; position?: number; children: React.ReactNode; disabled: boolean; isFloating?: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: isFloating ? `badge-${type}-floating` : `badge-${type}-${position}`,
        data: { type: 'badge', badgeType: type, position: position ?? -1, isFloating },
        disabled,
    });

    return (
        <span
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`px-2 py-1 text-xs font-bold rounded shadow ${type === 'sb' ? 'bg-purple-500 text-white' : 'bg-pink-500 text-white'
                } ${isDragging ? 'opacity-50' : disabled ? '' : 'cursor-grab hover:scale-110 transition-transform'}`}
        >
            {children}
        </span>
    );
}

// ドロップ可能な座席
function DroppableSeat({ position, children }: { position: number; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `seat-${position}`,
        data: { type: 'seat', position },
    });

    return (
        <div ref={setNodeRef} className={isOver ? 'ring-4 ring-yellow-400 rounded-xl' : ''}>
            {children}
        </div>
    );
}

// ドロップ可能なプレイヤーカード(SB/BBバッジ用)
function DroppablePlayerCard({ player, children }: { player: Player; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `player-card-${player.id}`,
        data: { type: 'player-card', player },
    });

    return (
        <div ref={setNodeRef} className={`p-2 -m-2 rounded-xl transition-all ${isOver ? 'ring-4 ring-purple-400 bg-purple-500/10' : ''}`}>
            {children}
        </div>
    );
}

export default function PokerMat({ players, room, currentPlayerId, isHost }: PokerMatProps) {
    const [activeItem, setActiveItem] = useState<any>(null);

    const getPlayerPosition = (position: number, total: number) => {
        const angle = (position / total) * 2 * Math.PI - Math.PI / 2;
        const radiusX = 42;
        const radiusY = 35;
        const centerX = 50;
        const centerY = 50;

        const x = centerX + radiusX * Math.cos(angle);
        const y = centerY + radiusY * Math.sin(angle);

        return { x, y };
    };

    const handleDragStart = (event: any) => {
        setActiveItem(event.active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);

        if (!over || !isHost) return;

        const dragData = active.data.current;
        const dropData = over.data.current;

        // プレイヤーを座席にドロップ
        if (dragData?.type === 'player' && dropData?.type === 'seat') {
            const draggedPlayer = dragData.player as Player;
            const targetPosition = dropData.position as number;

            if (draggedPlayer.position === targetPosition) return;

            const targetPlayer = players.find(p => p.position === targetPosition);

            // Fire-and-forget: APIを呼び出すが結果を待たない
            // Supabaseのリアルタイム購読が自動的にUIを更新する
            if (targetPlayer) {
                // 入れ替え
                fetch('/api/players/swap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        room_id: room.id,
                        player1_id: draggedPlayer.id,
                        player2_id: targetPlayer.id,
                    }),
                }).catch(err => {
                    console.error('座席の入れ替えに失敗:', err);
                    alert('座席の入れ替えに失敗しました');
                });
            } else {
                // 空席に移動
                fetch('/api/players/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        player_id: draggedPlayer.id,
                        new_position: targetPosition,
                    }),
                }).catch(err => {
                    console.error('座席の移動に失敗:', err);
                    alert('座席の移動に失敗しました');
                });
            }
        }

        // SB/BBバッジをプレイヤーカードにドロップ
        if (dragData?.type === 'badge' && dropData?.type === 'player-card') {
            const badgeType = dragData.badgeType as 'sb' | 'bb';
            const targetPlayer = dropData.player as Player;

            const updates: any = {
                room_id: room.id,
            };

            if (badgeType === 'sb') {
                updates.sb_position = targetPlayer.position;
                updates.bb_position = room.bb_position ?? null;
            } else {
                updates.sb_position = room.sb_position ?? null;
                updates.bb_position = targetPlayer.position;
            }

            // Fire-and-forget: APIを呼び出すが結果を待たない
            fetch('/api/blinds/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            }).catch(err => {
                console.error('ブラインド設定に失敗:', err);
                alert('ブラインド設定に失敗しました');
            });
        }
    };

    const renderPlayerCard = (player: Player, index: number) => {
        const isDealer = room.dealer_position === index;
        const isSB = room.sb_position === index;
        const isBB = room.bb_position === index;
        const isCurrentPlayer = player?.id === currentPlayerId;

        return (
            <div className="flex flex-col items-center gap-2">
                <DroppablePlayerCard player={player}>
                    <div
                        className={`relative px-4 py-3 rounded-xl border-2 shadow-lg min-w-[140px] ${isCurrentPlayer
                            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400'
                            : player.status === 'folded'
                                ? 'bg-slate-800/80 border-slate-600 opacity-50'
                                : 'bg-slate-800/90 border-slate-600'
                            }`}
                    >
                        {/* バッジ */}
                        <div className="absolute -top-2 -right-2 flex gap-1">
                            {isDealer && (
                                <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded shadow">
                                    D
                                </span>
                            )}
                            {isSB && (
                                <DraggableBadge type="sb" position={index} disabled={!isHost || room.status === 'playing'}>
                                    SB
                                </DraggableBadge>
                            )}
                            {isBB && (
                                <DraggableBadge type="bb" position={index} disabled={!isHost || room.status === 'playing'}>
                                    BB
                                </DraggableBadge>
                            )}
                        </div>

                        {/* プレイヤー情報 */}
                        <p className="text-white font-bold text-sm truncate">{player.nickname}</p>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-400">チップ:</span>
                            <span className="text-emerald-400 font-bold">{player.chips}</span>
                        </div>

                        {/* ステータス */}
                        {player.status === 'folded' && (
                            <p className="text-xs text-red-400 font-semibold mt-1">FOLD</p>
                        )}
                        {player.status === 'all_in' && (
                            <p className="text-xs text-yellow-400 font-semibold mt-1">ALL IN</p>
                        )}
                    </div>
                </DroppablePlayerCard>

                {/* ベット額表示 */}
                {player.current_bet > 0 && (
                    <div className="px-3 py-2 bg-yellow-500 rounded-lg shadow-lg border-2 border-yellow-600">
                        <p className="text-xs text-yellow-900 font-bold">BET</p>
                        <p className="text-lg font-bold text-yellow-950">{player.current_bet}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="relative w-full max-w-5xl mx-auto" style={{ aspectRatio: '16/10' }}>
                {/* ヒント表示 */}
                {isHost && room.status === 'waiting' && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-slate-900/90 rounded-lg border border-emerald-500/50">
                        <p className="text-xs text-emerald-400">💡 プレイヤーカードやSB/BBバッジをドラッグして配置を変更できます</p>
                    </div>
                )}

                {/* ポーカーテーブル */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="relative w-full h-full rounded-[50%] bg-gradient-to-br from-amber-900 to-amber-950 p-4 shadow-2xl">
                        <div className="relative w-full h-full rounded-[50%] bg-gradient-to-br from-emerald-800 to-emerald-900 border-4 border-emerald-600/30 shadow-inner">
                            {/* テーブル中央 */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <p className="text-emerald-300/40 text-sm font-bold tracking-widest">NO LIMIT TEXAS HOLD'EM</p>
                                    <div className="mt-4 px-6 py-3 bg-slate-900/50 rounded-full border-2 border-yellow-500/50">
                                        <p className="text-xs text-slate-400">POT</p>
                                        <p className="text-2xl font-bold text-yellow-400">{room.current_pot}</p>
                                    </div>

                                    {/* 未割り当てのSB/BBバッジ */}
                                    {isHost && room.status === 'waiting' && (
                                        <div className="mt-4 flex gap-3 justify-center pointer-events-auto">
                                            {(room.sb_position === null || room.sb_position === undefined) && (
                                                <div className="flex flex-col items-center gap-1">
                                                    <DraggableBadge type="sb" disabled={false} isFloating={true}>
                                                        SB
                                                    </DraggableBadge>
                                                    <p className="text-xs text-slate-400">ドラッグして割当</p>
                                                </div>
                                            )}
                                            {(room.bb_position === null || room.bb_position === undefined) && (
                                                <div className="flex flex-col items-center gap-1">
                                                    <DraggableBadge type="bb" disabled={false} isFloating={true}>
                                                        BB
                                                    </DraggableBadge>
                                                    <p className="text-xs text-slate-400">ドラッグして割当</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* プレイヤー配置 */}
                            {Array.from({ length: room.max_players }).map((_, index) => {
                                const player = players.find(p => p.position === index);
                                const pos = getPlayerPosition(index, room.max_players);

                                return (
                                    <div
                                        key={index}
                                        className="absolute"
                                        style={{
                                            left: `${pos.x}%`,
                                            top: `${pos.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    >
                                        <DroppableSeat position={index}>
                                            {player ? (
                                                <DraggablePlayer player={player} disabled={!isHost || room.status === 'playing'}>
                                                    {renderPlayerCard(player, index)}
                                                </DraggablePlayer>
                                            ) : (
                                                <div className="px-4 py-3 bg-slate-800/30 border-2 border-slate-700/50 rounded-xl min-w-[140px] hover:border-emerald-500/50 transition-colors">
                                                    <p className="text-slate-500 text-sm text-center">座席 {index + 1}</p>
                                                    <p className="text-slate-600 text-xs text-center">空席</p>
                                                </div>
                                            )}
                                        </DroppableSeat>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ドラッグオーバーレイ */}
                <DragOverlay>
                    {activeItem?.type === 'player' && activeItem.player ? (
                        <div className="opacity-80">
                            {renderPlayerCard(activeItem.player, activeItem.player.position)}
                        </div>
                    ) : activeItem?.type === 'badge' ? (
                        <div className="px-3 py-2 bg-purple-500 text-white text-sm font-bold rounded shadow-lg opacity-80">
                            {activeItem.badgeType === 'sb' ? 'SB' : 'BB'}
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
