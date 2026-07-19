import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../supabase';
import { PROFILE_FIELDS_SELECT } from '../utils/profileMedia';

const AuthContext = createContext(null);

function applyProfileToState(setUser, setProfile, profileData) {
  setUser((currentUser) => ({ ...currentUser, profile: profileData }));
  setProfile(profileData);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    setProfileLoading(true);

    try {
      const { data, error, status, statusText } = await supabase
        .from('profiles')
        .select(PROFILE_FIELDS_SELECT)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro detalhado do Supabase ao buscar perfil:', error);
        console.error('Contexto da busca de perfil:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status,
          statusText,
          userId,
          select: PROFILE_FIELDS_SELECT,
        });
        setProfile(null);
        return null;
      }

      if (!data) {
        console.log('Executando backfill de perfil para o usuário:', userId);

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              username: `investigador_${userId.substring(0, 5)}`,
              role: 'visitor',
              bio: '',
            },
          ])
          .select(PROFILE_FIELDS_SELECT)
          .single();

        if (!insertError && newProfile) {
          applyProfileToState(setUser, setProfile, newProfile);
          return newProfile;
        }

        console.error('Falha ao criar perfil automaticamente:', insertError);

        if (insertError?.code === '23505') {
          const { data: existingProfile, error: refetchError } = await supabase
            .from('profiles')
            .select(PROFILE_FIELDS_SELECT)
            .eq('id', userId)
            .maybeSingle();

          if (!refetchError && existingProfile) {
            applyProfileToState(setUser, setProfile, existingProfile);
            return existingProfile;
          }
        }

        setProfile(null);
        return null;
      }

      applyProfileToState(setUser, setProfile, data);
      return data;
    } catch (unexpectedError) {
      console.error('Erro inesperado ao buscar perfil:', unexpectedError);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null;
    return fetchProfile(user.id);
  }, [fetchProfile, user?.id]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Erro detalhado do Supabase ao obter sessão:', sessionError);
        }

        if (!isMounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (unexpectedError) {
        console.error('Erro inesperado ao inicializar autenticação:', unexpectedError);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }

  return context;
}
