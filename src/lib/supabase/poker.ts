// Supabaseクライアント用のヘルパー関数

import { createClient } from '@supabase/supabase-js';
import type { GameRoom, Player, GameAction } from '../types/poker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ルームコード生成（6桁の英数字）
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ゲームルーム関連
export async function createGameRoom(): Promise<GameRoom | null> {
    const roomCode = generateRoomCode();

    const { data, error } = await supabase
        .from('game_rooms')
        .insert({
            room_code: roomCode,
            status: 'waiting',
            current_pot: 0,
            current_round: 1,
            dealer_position: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating game room:', error);
        return null;
    }

    return data as GameRoom;
}

export async function getGameRoom(roomCode: string): Promise<GameRoom | null> {
    const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

    if (error) {
        console.error('Error fetching game room:', error);
        return null;
    }

    return data as GameRoom;
}

export async function updateGameRoom(
    roomId: string,
    updates: Partial<GameRoom>
): Promise<boolean> {
    const { error } = await supabase
        .from('game_rooms')
        .update(updates)
        .eq('id', roomId);

    if (error) {
        console.error('Error updating game room:', error);
        return false;
    }

    return true;
}

// プレイヤー関連
export async function addPlayer(
    roomId: string,
    nickname: string,
    position: number
): Promise<Player | null> {
    const { data, error } = await supabase
        .from('players')
        .insert({
            room_id: roomId,
            nickname,
            position,
            chips: 1000,
            current_bet: 0,
            status: 'active',
            is_connected: true,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding player:', error);
        return null;
    }

    return data as Player;
}

export async function getPlayers(roomId: string): Promise<Player[]> {
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('position', { ascending: true });

    if (error) {
        console.error('Error fetching players:', error);
        return [];
    }

    return data as Player[];
}

export async function updatePlayer(
    playerId: string,
    updates: Partial<Player>
): Promise<boolean> {
    const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId);

    if (error) {
        console.error('Error updating player:', error);
        return false;
    }

    return true;
}

export async function getNextAvailablePosition(roomId: string): Promise<number | null> {
    // Get room to check max_players
    const { data: room } = await supabase
        .from('game_rooms')
        .select('max_players')
        .eq('id', roomId)
        .single();

    const maxPlayers = room?.max_players || 6;
    const players = await getPlayers(roomId);

    if (players.length >= maxPlayers) {
        return null; // ルームが満員
    }

    const occupiedPositions = new Set(players.map(p => p.position));

    for (let i = 0; i < maxPlayers; i++) {
        if (!occupiedPositions.has(i)) {
            return i;
        }
    }

    return null;
}

// アクション関連
export async function recordAction(
    roomId: string,
    playerId: string,
    actionType: string,
    amount: number,
    roundNumber: number
): Promise<GameAction | null> {
    const { data, error } = await supabase
        .from('game_actions')
        .insert({
            room_id: roomId,
            player_id: playerId,
            action_type: actionType,
            amount,
            round_number: roundNumber,
        })
        .select()
        .single();

    if (error) {
        console.error('Error recording action:', error);
        return null;
    }

    return data as GameAction;
}

export async function getActions(roomId: string, roundNumber?: number): Promise<GameAction[]> {
    let query = supabase
        .from('game_actions')
        .select('*')
        .eq('room_id', roomId);

    if (roundNumber !== undefined) {
        query = query.eq('round_number', roundNumber);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching actions:', error);
        return [];
    }

    return data as GameAction[];
}

// リアルタイムサブスクリプション
export function subscribeToRoom(
    roomId: string,
    onRoomUpdate: (room: GameRoom) => void,
    onPlayersUpdate: (players: Player[]) => void,
    onActionUpdate: (action: GameAction) => void
) {
    console.log('🔌 Setting up realtime subscriptions for room:', roomId);

    // ゲームルームの変更を監視
    const roomChannel = supabase
        .channel(`room:${roomId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${roomId}`,
            },
            (payload) => {
                console.log('🎮 Room updated:', payload);
                onRoomUpdate(payload.new as GameRoom);
            }
        )
        .subscribe((status) => {
            console.log('🎮 Room channel status:', status);
        });

    // プレイヤーの変更を監視
    const playersChannel = supabase
        .channel(`players:${roomId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'players',
                filter: `room_id=eq.${roomId}`,
            },
            async (payload) => {
                console.log('👥 Players updated:', payload);
                // プレイヤーリストを再取得
                const players = await getPlayers(roomId);
                onPlayersUpdate(players);
            }
        )
        .subscribe((status) => {
            console.log('👥 Players channel status:', status);
        });

    // アクションの変更を監視
    const actionsChannel = supabase
        .channel(`actions:${roomId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'game_actions',
                filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
                console.log('🎯 Action inserted:', payload);
                onActionUpdate(payload.new as GameAction);
            }
        )
        .subscribe((status) => {
            console.log('🎯 Actions channel status:', status);
        });

    // クリーンアップ関数を返す
    return () => {
        console.log('🔌 Cleaning up realtime subscriptions for room:', roomId);
        supabase.removeChannel(roomChannel);
        supabase.removeChannel(playersChannel);
        supabase.removeChannel(actionsChannel);
    };
}

// ブラインド関連
export async function setBlinds(
    roomId: string,
    sbPosition: number,
    bbPosition: number
): Promise<boolean> {
    const { error } = await supabase
        .from('game_rooms')
        .update({
            sb_position: sbPosition,
            bb_position: bbPosition,
        })
        .eq('id', roomId);

    if (error) {
        console.error('Error setting blinds:', error);
        return false;
    }

    return true;
}

export async function collectBlinds(roomId: string): Promise<boolean> {
    try {
        // Get room and players
        const { data: room } = await supabase
            .from('game_rooms')
            .select('*')
            .eq('id', roomId)
            .single();

        if (!room || room.sb_position === null || room.bb_position === null) {
            return false;
        }

        const players = await getPlayers(roomId);
        const sbPlayer = players.find(p => p.position === room.sb_position);
        const bbPlayer = players.find(p => p.position === room.bb_position);

        if (!sbPlayer || !bbPlayer) {
            return false;
        }

        // Deduct blinds from players
        await updatePlayer(sbPlayer.id, {
            chips: sbPlayer.chips - room.small_blind,
            current_bet: room.small_blind,
        });

        await updatePlayer(bbPlayer.id, {
            chips: bbPlayer.chips - room.big_blind,
            current_bet: room.big_blind,
        });

        // Add to pot
        await updateGameRoom(roomId, {
            current_pot: room.small_blind + room.big_blind,
        });

        return true;
    } catch (error) {
        console.error('Error collecting blinds:', error);
        return false;
    }
}

// コイン譲渡関連
export async function transferCoins(
    roomId: string,
    fromPlayerId: string,
    toPlayerId: string,
    amount: number
): Promise<any> {
    try {
        const players = await getPlayers(roomId);
        const fromPlayer = players.find(p => p.id === fromPlayerId);
        const toPlayer = players.find(p => p.id === toPlayerId);

        if (!fromPlayer || !toPlayer) {
            return null;
        }

        if (fromPlayer.chips < amount) {
            return null;
        }

        // Update player chips
        await updatePlayer(fromPlayerId, {
            chips: fromPlayer.chips - amount,
        });

        await updatePlayer(toPlayerId, {
            chips: toPlayer.chips + amount,
        });

        // Record transfer
        const { data, error } = await supabase
            .from('coin_transfers')
            .insert({
                room_id: roomId,
                from_player_id: fromPlayerId,
                to_player_id: toPlayerId,
                amount,
            })
            .select()
            .single();

        if (error) {
            console.error('Error recording transfer:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error transferring coins:', error);
        return null;
    }
}

export async function getCoinTransfers(roomId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('coin_transfers')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching coin transfers:', error);
        return [];
    }

    return data || [];
}

