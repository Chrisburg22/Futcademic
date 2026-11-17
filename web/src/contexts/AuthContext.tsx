import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { clearPersistedCache } from '../lib/queryClient';
import {
  clearCachedProfile,
  readCachedProfile,
  readPersistedSession,
  saveCachedProfile,
} from '../lib/offlineAuth';
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

  // Sin red la consulta a `users` falla: se cae al perfil guardado de la última
  // sesión con conexión, que es lo que permite que el AppShell se pinte igual.
  const applyCachedProfile = (userId: string) => {
    const cached = readCachedProfile<Profile>();
    if (cached && cached.id === userId) {
      setProfile(cached);
      return true;
    }
    return false;
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`*, school:schools ( name, logo_url )`)
        .eq('id', userId)
        .single();
      if (error) {
        console.error('AuthContext: fetchProfile error:', error);
        applyCachedProfile(userId);
      }
      if (data) {
        // phone/address/emergencia viven en profile_information, no en users
        const { data: extra } = await supabase
          .from('profile_information')
          .select('phone, address, emergency_contact_name, emergency_contact_phone, avatar_url')
          .eq('id', userId)
          .maybeSingle();
        const merged = {
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
        } as Profile;
        setProfile(merged);
        saveCachedProfile(merged);
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error in fetchProfile:', err);
      applyCachedProfile(userId);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // `getSession()` devuelve null si el token caducó y el refresh no sale (sin
    // red), así que como respaldo se lee la sesión escrita en localStorage. Es
    // lo que evita que la PWA sin conexión rebote a /login.
    const resolveSession = async () => {
      let current: Session | null = null;
      try {
        const { data } = await supabase.auth.getSession();
        current = data.session;
      } catch (err) {
        console.error('AuthContext: getSession error:', err);
      }
      if (!current) current = readPersistedSession();

      setSession(current);
      setUser(current?.user ?? null);
      if (current?.user) {
        // Pinta ya con el perfil guardado y refresca si hay red. Con copia
        // local no hace falta esperar a la red para dejar de mostrar el
        // Loader: sin conexión la consulta puede tardar en fallar.
        if (applyCachedProfile(current.user.id)) setIsLoading(false);
        void fetchProfile(current.user.id);
      } else {
        setIsLoading(false);
      }
    };

    void resolveSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Un refresh fallido sin red llega como TOKEN_REFRESHED/SIGNED_OUT con
      // sesión nula: si no fue un cierre de sesión explícito, se conserva la
      // sesión local en vez de echar al usuario de la app.
      if (!session && event !== 'SIGNED_OUT') return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) void fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Sin red el POST de logout falla; la sesión local se limpia igual, que
      // es lo que importa en un dispositivo compartido.
      await supabase.auth.signOut();
    } catch (err) {
      console.error('AuthContext: signOut error:', err);
    }
    setProfile(null);
    setSession(null);
    setUser(null);
    // Borra la caché persistida: si no, el siguiente usuario de este
    // navegador vería datos de la academia anterior.
    clearCachedProfile();
    clearPersistedCache();
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
