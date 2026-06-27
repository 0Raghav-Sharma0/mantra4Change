import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: readonly unknown[],
  enabled = true,
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });
  const tick = useRef(0);

  const run = useCallback(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const id = ++tick.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    asyncFn()
      .then((data) => {
        if (id === tick.current) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (id === tick.current) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Request failed",
          });
        }
      });
  }, [asyncFn, enabled]);

  useEffect(() => {
    run();
  }, [run, ...deps]);

  return { ...state, reload: run };
}
