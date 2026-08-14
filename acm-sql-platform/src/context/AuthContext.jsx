import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  session: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reliable fetchProfile helper: strictly reads real DB profile from Supabase
  const fetchProfile = useCallback(async (userId, currentUser = null) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    try {
      // 1. Fetch live profile row from Supabase
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // If profile exists in the database, prioritize it and sync state
      if (!error && data) {
        setProfile(data);
        return data;
      }

      // 2. Only if the row genuinely doesn't exist in Supabase (406 or PGRST116), perform insert
      const isNotFound = !data && (status === 406 || error?.code === 'PGRST116' || !error);

      if (isNotFound) {
        console.warn(`Profile record missing for user ${userId}. Creating initial profile...`);

        let userEmail = currentUser?.email || '';
        let userName = currentUser?.user_metadata?.full_name || 'Student';

        if (!userEmail) {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user) {
            userEmail = authUser.user.email || '';
            userName = authUser.user.user_metadata?.full_name || userName;
          }
        }

        const newProfilePayload = {
          id: userId,
          email: userEmail,
          full_name: userName,
          role: 'student',
          total_points: 0,
          streak_count: 0,
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfilePayload])
          .select()
          .single();

        if (insertError) {
          console.error('Initial profile insertion error:', insertError.message);
          // If insert failed due to duplicate/conflict, retry fetch once
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (retryData) {
            setProfile(retryData);
            return retryData;
          }
        }

        const resolved = insertedData || newProfilePayload;
        setProfile(resolved);
        return resolved;
      }

      console.error('Error fetching profile from Supabase:', error?.message || error);
      return null;
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      return null;
    }
  }, []);

  // Initial session check, auth listener, and Realtime replication subscription
  useEffect(() => {
    let mounted = true;
    let realtimeChannel = null;

    // Helper: subscribe to PostgreSQL changes on public.profiles for the logged in user
    const setupRealtimeSubscription = (userId) => {
      if (!userId) return;

      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      realtimeChannel = supabase
        .channel(`profile-realtime-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            console.log('⚡ Realtime profile update received:', payload.new);
            if (payload?.new && mounted) {
              setProfile((prev) => ({
                ...(prev || {}),
                ...payload.new,
              }));
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`🔌 Realtime profile channel subscribed for ${userId}`);
          }
        });
    };

    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(initialSession);
          const currentUser = initialSession?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            await fetchProfile(currentUser.id, currentUser);
            setupRealtimeSubscription(currentUser.id);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Error during initial auth verification:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // If we already have the profile with matching id, keep it while refreshing in background
          await fetchProfile(currentUser.id, currentUser);
          setupRealtimeSubscription(currentUser.id);
        } else {
          setProfile(null);
          if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
          }
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  }, [fetchProfile]);

  // Auth operations with guaranteed user and profile state synchronization
  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { data: null, error, profile: null };
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        // Explicitly fetch the database profile before completing login
        const userProfile = await fetchProfile(data.user.id, data.user);
        setLoading(false);
        return { data, error: null, profile: userProfile };
      }

      setLoading(false);
      return { data, error: null, profile: null };
    } catch (err) {
      setLoading(false);
      return { data: null, error: err, profile: null };
    }
  };

  const signup = async ({ email, password, fullName }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || 'Student',
          },
        },
      });

      if (error) {
        setLoading(false);
        return { data: null, error, profile: null };
      }

      let userProfile = null;
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        if (data.session) {
          userProfile = await fetchProfile(data.user.id, data.user);
        }
      }

      setLoading(false);
      return { data, error: null, profile: userProfile };
    } catch (err) {
      setLoading(false);
      return { data: null, error: err, profile: null };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      return await fetchProfile(user.id, user);
    }
    return null;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    login,
    signup,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
