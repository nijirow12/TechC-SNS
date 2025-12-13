// ポーカーゲーム用の型定義

export type GameStatus = 'waiting' | 'playing' | 'finished';
export type PlayerStatus = 'active' | 'folded' | 'all_in';
export type ActionType = 'bet' | 'raise' | 'call' | 'fold' | 'check' | 'all_in';

export interface GameRoom {
    id: string;
    room_code: string;
    status: GameStatus;
    current_pot: number;
    current_round: number;
    dealer_position: number;
    small_blind: number;
    big_blind: number;
    sb_position: number | null;
    bb_position: number | null;
    max_players: number;
    created_at: string;
    updated_at: string;
}

export interface Player {
    id: string;
    room_id: string;
    nickname: string;
    position: number;
    chips: number;
    current_bet: number;
    status: PlayerStatus;
    is_connected: boolean;
    joined_at: string;
}

export interface GameAction {
    id: string;
    room_id: string;
    player_id: string;
    action_type: ActionType;
    amount: number;
    round_number: number;
    created_at: string;
}

export interface CoinTransfer {
    id: string;
    room_id: string;
    from_player_id: string;
    to_player_id: string;
    amount: number;
    created_at: string;
}

// APIレスポンス型
export interface CreateRoomResponse {
    success: boolean;
    room_code?: string;
    error?: string;
}

export interface JoinRoomResponse {
    success: boolean;
    player?: Player;
    error?: string;
}

export interface ActionResponse {
    success: boolean;
    error?: string;
}

export interface TransferResponse {
    success: boolean;
    transfer?: CoinTransfer;
    error?: string;
}

// サイドポット関連
export interface SidePot {
    id: string;
    room_id: string;
    round_number: number;
    pot_index: number; // 0=メインポット, 1,2,...=サイドポット
    amount: number;
    eligible_player_ids: string[]; // 参加可能なプレイヤーID配列
    created_at: string;
}

export interface PotWinnerSelection {
    pot_index: number;
    winner_ids: string[];
}
