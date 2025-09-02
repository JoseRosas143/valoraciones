
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // We don't want to do anything until the auth state is confirmed
    if (loading) {
      return;
    }

    if (user) {
      // If the user is logged in, redirect them to the main app page
      router.replace('/forms');
    } else {
      // If the user is not logged in, redirect them to the login page
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show a loading indicator while we determine the auth state
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando aplicación...</p>
      </div>
    </div>
  );
}
