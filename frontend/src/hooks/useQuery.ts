import { useState, useEffect, useCallback, useRef } from 'react';

interface UseQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options: UseQueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { enabled = true, refetchInterval } = options;
  
  // Store queryFn in a ref to avoid re-creating fetchData on every render
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  // Use key as string for stable dependency
  const keyString = JSON.stringify(key);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await queryFnRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyString, enabled]);

  useEffect(() => {
    fetchData();

    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyString, refetchInterval, enabled]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch };
}

