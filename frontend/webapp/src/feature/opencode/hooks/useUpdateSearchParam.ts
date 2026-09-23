import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Updates a single query parameter while leaving the pathname untouched.
 *
 * setSearchParams is deliberately not used: it navigates relative to the route
 * that owns the calling component, which drops any deeper segment — calling it
 * from the open coding layout would throw away the :traceGroupId of the
 * selected group and bounce back to the index route.
 */
export function useUpdateSearchParam() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (key: string, value: string | boolean | null) => {
      const params = new URLSearchParams(location.search);

      if (value === null || value === '' || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }

      const search = params.toString();
      if (search === new URLSearchParams(location.search).toString()) return;

      navigate({ pathname: location.pathname, search }, { replace: true });
    },
    [location.pathname, location.search, navigate]
  );
}
