'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpForm() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await signUp(username, password, displayName || username);
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'アカウント作成に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>アカウント作成</CardTitle>
                <CardDescription>TechC SNSへようこそ</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">
                            ユーザーID <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="techc_user"
                            required
                            minLength={3}
                            maxLength={20}
                            pattern="[a-zA-Z0-9_]+"
                        />
                        <p className="text-xs text-muted-foreground">
                            3-20文字、英数字とアンダースコアのみ
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="displayName">表示名</Label>
                        <Input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Tech C User"
                            maxLength={50}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            パスワード <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-muted-foreground">6文字以上</p>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'アカウント作成中...' : 'アカウントを作成'}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        すでにアカウントをお持ちですか？{' '}
                        <a href="/login" className="text-primary hover:underline font-medium">
                            ログイン
                        </a>
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
