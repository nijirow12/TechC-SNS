interface PotDisplayProps {
    pot: number;
    round: number;
}

export default function PotDisplay({ pot, round }: PotDisplayProps) {
    return (
        <div className="p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-1">ラウンド {round}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm text-slate-400">ポット:</span>
                        <span className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            {pot}
                        </span>
                    </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl">
                    <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
