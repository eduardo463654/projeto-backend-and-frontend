import { useEffect, useRef } from "react";

export function usePolling<T>(
  request: () => Promise<T>,
  onSuccess: (result: T) => void,
  intervalMs = 5000,
) {
  const requestRef = useRef(request);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    requestRef.current = request;
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    let active = true;
    let inFlight = false;

    const poll = async () => {
      if (!active || inFlight || document.visibilityState === "hidden") return;

      inFlight = true;
      try {
        const result = await requestRef.current();
        if (active) onSuccessRef.current(result);
      } catch {
        // Keep the latest displayed data when a background refresh fails.
      } finally {
        inFlight = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void poll();
    };

    const intervalId = window.setInterval(() => void poll(), intervalMs);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs]);
}
