import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'super_admin' | 'admin' | 'profesor' | 'padre' | 'alumno';
  school_id: string;
  must_change_password?: boolean;
  phone?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  avatar_url?: string | null;
  school?: { name: string; logo_url: string | null } | null;
  [key: string]: any;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`*, school:schools ( name, logo_url )`)
        .eq('id', userId)
        .single();
      if (error) console.error('AuthContext: fetchProfile error:', error);
      if (data) {
        // phone/address/emergencia viven en profile_information, no en users
        const { data: extra } = await supabase
          .from('profile_information')
          .select('phone, address, emergency_contact_name, emergency_contact_phone, avatar_url')
          .eq('id', userId)
          .maybeSingle();
        setProfile({
          ...data,
          ...(extra
            ? {
                phone: extra.phone ?? data.phone,
                address: extra.address ?? data.address,
                emergency_contact_name: extra.emergency_contact_name,
                emergency_contact_phone: extra.emergency_contact_phone,
                avatar_url: extra.avatar_url ?? data.avatar_url,
              }
            : {}),
        } as Profile);
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error in fetchProfile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        refreshProfile: () => fetchProfile(user?.id || ''),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
