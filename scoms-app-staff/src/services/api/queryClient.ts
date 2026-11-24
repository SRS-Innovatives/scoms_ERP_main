import { QueryClient } from '@tanstack/react-query';

const httpStatus = (err: unknown): number | undefined => (err as { response?: { status?: number } })?.response?.status;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry only what can succeed on retry: network errors / 5xx. A 4xx (forbidden,
      // module off, not found, validation) answers the same the second time.
      retry: (failureCount, err) => {
        const status = httpStatus(err);
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
