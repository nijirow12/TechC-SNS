import { NextRequest, NextResponse } from 'next/server';
import { getCoinTransfers } from '@/lib/supabase/poker';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const room_id = searchParams.get('room_id');

        if (!room_id) {
            return NextResponse.json(
                { success: false, error: 'ルームIDが必要です' },
                { status: 400 }
            );
        }

        const transfers = await getCoinTransfers(room_id);

        return NextResponse.json({ success: true, transfers });
    } catch (error) {
        console.error('Error in get transfers API:', error);
        return NextResponse.json(
            { success: false, error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
