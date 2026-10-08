import { useCallback, useEffect, useRef, useState } from "react";
import api, { errorMessage } from "../lib/api";

export function useList(url, params = {}, { size = 25, enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query = { ...JSON.parse(paramsKey), page, size };
    Object.keys(query).forEach((key) => query[key] === undefined && delete query[key]);
    api
      .get(url, { params: query })
      .then(({ data }) => {
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 0);
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [url, paramsKey, page, size, enabled, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    setPage(1);
  }, [paramsKey]);

  return { items, total, pages, page, setPage, loading, error, refresh };
}

export function useFetch(url, { enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(url)
      .then(({ data: payload }) => !cancelled && setData(payload))
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [url, enabled, version, ...deps]);

  return { data, loading, error, refresh: () => setVersion((v) => v + 1), setData };
}

export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer.current);
  }, [value, delay]);
  return debounced;
}