'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { UserProfile } from '@/types';
import { isConsentComplete } from '@/components/onboarding/ConsentGate';

// Singleton in-memory session cache & in-flight request deduping across all components
let cachedUser: UserProfile | null = null;
let cachedIsBanned: boolean = false;
let sessionPromise: Promise<{ user: UserProfile; isBanned: boolean } | null> | null = null;

async function fetchSession(forceRefresh = false): Promise<{ user: UserProfile; isBanned: boolean } | null> {
  if (!forceRefresh && cachedUser) {
    return { user: cachedUser, isBanned: cachedIsBanned };
  }

  if (sessionPromise && !forceRefresh) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    try {
      const consentGiven = isConsentComplete();
      const data = await apiClient<{ success: boolean; user: UserProfile; isBanned: boolean; token?: string }>(
        `/api/auth/session?hasConsent=${consentGiven ? 'true' : 'false'}`
      );
      if (data.success && data.user) {
        const isSkip = !data.user.gender || data.user.gender === 'skip' || data.user.gender === 'prefer_not_to_say';
        const resolvedHandle = consentGiven
          ? (isSkip && (!data.user.handle || !data.user.handle.startsWith('Cockroach #'))
              ? `Cockroach #${data.user.tag}`
              : data.user.handle)
          : '';
        const userObj: UserProfile = {
          ...data.user,
          handle: resolvedHandle,
          hasChosenGender: consentGiven && Boolean(data.user.hasChosenGender)
        };
        cachedUser = userObj;
        cachedIsBanned = data.isBanned;
        return { user: userObj, isBanned: data.isBanned };
      }
      return null;
    } catch (err) {
      console.error('Failed to initialize session:', err);
      return null;
    } finally {
      sessionPromise = null;
    }
  })();

  return sessionPromise;
}

export function useAuthorTag() {
  const [user, setUser] = useState<UserProfile | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [isBanned, setIsBanned] = useState(cachedIsBanned);
  const userRef = useRef<UserProfile | null>(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function load(force = false) {
      const result = await fetchSession(force);
      if (isMounted && result) {
        setUser(result.user);
        setIsBanned(result.isBanned);
        setLoading(false);
      } else if (isMounted) {
        setLoading(false);
      }
    }

    load();

    const onConsentUpdate = () => {
      load(true);
    };
    window.addEventListener('ct-consent-updated', onConsentUpdate);

    const onUserUpdate = (e: any) => {
      if (e.detail && isMounted) {
        cachedUser = e.detail;
        setUser(e.detail);
      }
    };
    window.addEventListener('ct-user-updated', onUserUpdate);

    // 30s Heartbeat
    const interval = setInterval(async () => {
      try {
        const currentTag = userRef.current?.tag;
        if (!currentTag) return;
        const res = await apiClient<{ success: boolean; isBanned: boolean }>('/api/auth/heartbeat', {
          method: 'POST',
          body: JSON.stringify({ tag: currentTag })
        });
        if (res.isBanned && isMounted) {
          setIsBanned(true);
          cachedIsBanned = true;
        }
      } catch (e) {}
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('ct-consent-updated', onConsentUpdate);
      window.removeEventListener('ct-user-updated', onUserUpdate);
    };
  }, []); // Run ONCE on mount to prevent any infinite loops

  const updateProfile = async (bio: string, profilePicture: string, gender: string) => {
    try {
      const data = await apiClient<{ success: boolean; user: UserProfile; token?: string }>('/api/auth/profile', {
        method: 'POST',
        body: JSON.stringify({ bio, profilePicture, gender })
      });
      if (data.success && data.user) {
        cachedUser = data.user;
        setUser(data.user);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ct-user-updated', { detail: data.user }));
        }
      }
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const customizeProfile = async (updates: {
    handle?: string;
    avatarType?: 'initials' | 'identicon' | 'emoji';
    avatarValue?: string;
    accentColor?: string;
    bubbleStyle?: 'sharp' | 'rounded' | 'outline';
    statusTag?: string;
    bio?: string;
    gender?: string;
  }) => {
    try {
      const data = await apiClient<{ success: boolean; user: UserProfile; message?: string; token?: string }>(
        '/api/auth/customize',
        {
          method: 'POST',
          body: JSON.stringify(updates)
        }
      );
      if (data.success && data.user) {
        cachedUser = data.user;
        setUser(data.user);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ct-user-updated', { detail: data.user }));
        }
      }
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const rerollName = async () => {
    try {
      const data = await apiClient<{ success: boolean; user: UserProfile; message?: string; token?: string }>(
        '/api/auth/reroll-name',
        {
          method: 'POST',
          body: JSON.stringify({ tag: user?.tag })
        }
      );
      if (data.success && data.user) {
        cachedUser = data.user;
        setUser(data.user);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ct-user-updated', { detail: data.user }));
        }
      }
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const submitConsent = async (gender: string) => {
    try {
      const data = await apiClient<{ success: boolean; user: UserProfile; isBanned: boolean; token?: string }>(
        '/api/auth/consent',
        {
          method: 'POST',
          body: JSON.stringify({ gender })
        }
      );
      if (data.success && data.user) {
        cachedUser = data.user;
        cachedIsBanned = data.isBanned;
        setUser(data.user);
        setIsBanned(data.isBanned);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ct-user-updated', { detail: data.user }));
        }
      }
      return data;
    } catch (err: any) {
      console.error('Failed to submit consent:', err);
      throw err;
    }
  };

  return { user, loading, isBanned, updateProfile, customizeProfile, rerollName, submitConsent };
}
