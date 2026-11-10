import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'no-access'; user: User }
  | { status: 'error'; user: User }
  | { status: 'ready'; user: User; isAdmin: boolean };

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    const resolve = async (session: Session | null) => {
      if (!session) {
        if (active) setState({ status: 'signed-out' });
        return;
      }
      const user = session.user;
      if (active) setState({ status: 'loading' });
      const { data, error } = await supabase
        .from('allowed_staff')
        .select('user_id, is_admin')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error) setState({ status: 'error', user });
      else if (!data) setState({ status: 'no-access', user });
      else setState({ status: 'ready', user, isAdmin: data.is_admin });
    };

    supabase.auth.getSession().then(({ data }) => {
      void resolve(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        await resolve(session);
      })();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = () => {
    void supabase.auth.signOut();
  };

  return { state, signOut };
}
