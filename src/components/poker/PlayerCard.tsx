import type { Player } from '@/lib/types/poker';

interface PlayerCardProps {
    player?: Player;
    position: number;
    isDealer: boolean;
    isCurrentPlayer: boolean;
    sbPosition?: number | null;
    bbPosition?: number | null;
}

export default function PlayerCard({ player, position, isDealer, isCurrentPlayer, sbPosition, bbPosition }: PlayerCardProps) {
    const isSB = sbPosition !== null && sbPosition !== undefined && player?.position === sbPosition;
    const isBB = bbPosition !== null && bbPosition !== undefined && player?.position === bbPosition;
    if (!player) {
        return (
            <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <div className="text-center text-slate-500">
                    <p className="text-sm">座席 {position + 1}</p>
                    <p className="text-xs mt-1">空席</p>
                </div>
            </div>
        );
    }

    const statusColors = {
        active: 'text-emerald-400',
        folded: 'text-red-400',
        all_in: 'text-yellow-400',
    };

    const statusLabels = {
        active: 'アクティブ',
        folded: 'フォールド',
        all_in: 'オールイン',
    };

    return (
        <div
            className={`p-4 rounded-xl border-2 transition-all ${isCurrentPlayer
                ? 'bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800/50 border-slate-700'
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white truncate">{player.nickname}</h3>
                        <div className="flex gap-1">
                            {isDealer && (
                                <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                                    D
                                </span>
                            )}
                            {isSB && (
                                <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded">
                                    SB
                                </span>
                            )}
                            {isBB && (
                                <span className="px-2 py-1 bg-pink-500 text-white text-xs font-bold rounded">
                                    BB
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">座席 {position + 1}</p>
                </div>
                {!player.is_connected && (
                    <span className="text-xs text-red-400">●</span>
                )}
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">チップ:</span>
                    <span className="text-lg font-bold text-emerald-400">{player.chips}</span>
                </div>
                {player.current_bet > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">ベット:</span>
                        <span className="text-sm font-semibold text-yellow-400">{player.current_bet}</span>
                    </div>
                )}
                <div className="pt-1">
                    <span className={`text-xs font-medium ${statusColors[player.status]}`}>
                        {statusLabels[player.status]}
                    </span>
                </div>
            </div>
        </div>
    );
}
