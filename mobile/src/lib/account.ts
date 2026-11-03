import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@native/auth';
import { supabase } from '@native/supabase';

/** The signed-in customer's saved addresses, newest first. Empty when signed out. */
export function useAddresses() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['addresses', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('id, label, address')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
