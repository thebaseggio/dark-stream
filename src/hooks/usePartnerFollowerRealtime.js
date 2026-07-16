import { useEffect } from 'react';
import { subscribePartnerFollowerCount } from '../utils/subscriptions';

export default function usePartnerFollowerRealtime(supabase, creatorId, setFollowerCount) {
  useEffect(() => {
    if (!creatorId) return undefined;

    return subscribePartnerFollowerCount(supabase, creatorId, setFollowerCount);
  }, [supabase, creatorId, setFollowerCount]);
}
