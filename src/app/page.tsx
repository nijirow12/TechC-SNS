'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';

interface UserAccount {
  id: string;
  display_name: string;
  total_chips: number;
  games_played: number;
  games_won: number;
}

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  // ユーザーアカウント情報を取得
  useEffect(() => {
    const fetchUserAccount = async () => {
      if (!isSignedIn) {
        setUserAccount(null);
        return;
      }

      setLoadingAccount(true);
      try {
        // ユーザーアカウントを取得または作成
        const response = await fetch('/api/users/me', {
          method: 'POST',
        });
        const data = await response.json();
        if (data.success) {
          setUserAccount(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user account:', err);
      } finally {
        setLoadingAccount(false);
      }
    };

    if (isLoaded) {
      fetchUserAccount();
    }
  }, [isLoaded, isSignedIn]);

  const handleCreateRoom = async () => {
    if (!isSignedIn) {
      setError('ルームを作成するにはログインが必要です');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('is_host', 'true');
        router.push(`/room/${data.room_code}`);
      } else {
        setError(data.error || 'ルームの作成に失敗しました');
      }
    } catch (err) {
      setError('サーバーエラーが発生しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      setError('ルームに参加するにはログインが必要です');
      return;
    }

    if (!roomCode.trim()) {
      setError('ルームコードを入力してください');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_code: roomCode.toUpperCase(),
          nickname: nickname.trim() || userAccount?.display_name || user?.username || 'Player',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // プレイヤーIDをローカルストレージに保存
        localStorage.setItem('player_id', data.player.id);
        localStorage.setItem('player_nickname', data.player.nickname);
        localStorage.removeItem('is_host');
        router.push(`/room/${roomCode.toUpperCase()}`);
      } else {
        setError(data.error || 'ルームへの参加に失敗しました');
      }
    } catch (err) {
      setError('サーバーエラーが発生しました');
    } finally {
      setIsJoining(false);
    }
  };

  // ローディング中
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8 mt-16">
          <div className="mb-4">
            <div className="inline-block p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            ポーカーコイン管理
          </h1>
          <p className="text-slate-400">リアルタイムでコイン処理</p>
        </div>

        {/* ユーザー情報表示（ログイン済みの場合） */}
        {isSignedIn && userAccount && (
          <div className="mb-6 p-4 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm rounded-xl border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">ようこそ、</p>
                <p className="text-lg font-semibold text-emerald-400">{userAccount.display_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">チップ残高</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {userAccount.total_chips.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-500">
              <span>プレイ回数: {userAccount.games_played}</span>
              <span>勝利: {userAccount.games_won}</span>
            </div>
          </div>
        )}

        {/* 未ログイン時のメッセージ */}
        {!isSignedIn && (
          <div className="mb-6 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 text-center">
            <p className="text-slate-300 mb-4">
              ゲームに参加するにはログインが必要です
            </p>
            <div className="flex gap-3 justify-center">
              <SignInButton mode="modal">
                <button className="px-6 py-2 text-sm font-medium text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-all">
                  サインイン
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg transition-all shadow-lg">
                  新規登録
                </button>
              </SignUpButton>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ルーム作成 */}
        <div className="mb-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">新しいルームを作成</h2>
          <button
            onClick={handleCreateRoom}
            disabled={isCreating || !isSignedIn}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 disabled:cursor-not-allowed"
          >
            {isCreating ? '作成中...' : 'ルームを作成'}
          </button>
        </div>

        {/* ルーム参加 */}
        <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-teal-400">既存のルームに参加</h2>
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-slate-300 mb-2">
                ルームコード
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="例: ABC123"
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-slate-500 uppercase"
              />
            </div>
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-slate-300 mb-2">
                ニックネーム（任意）
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={userAccount?.display_name || 'アカウント名を使用'}
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={isJoining || !isSignedIn}
              className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-teal-500/50 disabled:cursor-not-allowed"
            >
              {isJoining ? '参加中...' : 'ルームに参加'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

