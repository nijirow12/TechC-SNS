'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import PostComposer from '@/components/posts/PostComposer';
import Timeline from '@/components/posts/Timeline';
import { createProfile, getProfileByClerkId } from '@/lib/supabase';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    } else if (isLoaded && isSignedIn && user) {
      // Ensure profile exists in Supabase
      ensureProfile();
    }
  }, [isLoaded, isSignedIn, user, router]);

  const ensureProfile = async () => {
    if (!user) return;

    try {
      // Check if profile exists
      const existingProfile = await getProfileByClerkId(user.id);

      if (!existingProfile) {
        // Create profile if it doesn't exist
        await createProfile(
          user.id,
          user.username || `user_${user.id.slice(0, 8)}`,
          user.fullName || user.username || 'User',
          user.imageUrl
        );
      }

      setProfileReady(true);
    } catch (err) {
      console.error('Profile sync error:', err);
      setProfileReady(true); // Continue anyway
    }
  };

  if (!isLoaded || !profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            TechC SNS
          </h1>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </div>

        {/* Post Composer */}
        <div className="border-b border-border">
          <PostComposer />
        </div>

        {/* Timeline */}
        <Timeline />
      </div>
    </div>
  );
}
