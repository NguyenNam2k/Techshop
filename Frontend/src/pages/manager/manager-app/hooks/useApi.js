// src/hooks/useApi.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Generic API hook for fetching data from the Express backend
 */
export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, options);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Lỗi API');
      setData(json.data ?? json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

/**
 * Base fetch wrapper with JSON body
 */
export async function apiCall(url, method = 'GET', body = null) {
  const opts = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const json = await res.json();
  return { ok: res.ok, status: res.status, ...json };
}
