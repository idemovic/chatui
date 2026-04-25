import { useEffect, useState } from 'react'

interface FeedResponse<T> {
  items?: T[]
}

interface FeedState<T> {
  data: T[]
  loading: boolean
  error: string | undefined
}

/**
 * Fetch a JSON feed in the shape `{ items: T[] }` from `url`. If `url` is unset,
 * falls back to `inline` synchronously. URL wins when both are provided.
 */
export function useFeedJson<T>(
  url: string | undefined,
  inline: T[] | undefined,
): FeedState<T> {
  const [state, setState] = useState<FeedState<T>>(() =>
    url
      ? { data: [], loading: true, error: undefined }
      : { data: inline ?? [], loading: false, error: undefined },
  )

  useEffect(() => {
    if (!url) {
      setState({ data: inline ?? [], loading: false, error: undefined })
      return
    }

    let cancelled = false
    setState({ data: [], loading: true, error: undefined })

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<FeedResponse<T>>
      })
      .then((json) => {
        if (cancelled) return
        setState({ data: json.items ?? [], loading: false, error: undefined })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Fetch failed'
        setState({ data: [], loading: false, error: msg })
      })

    return () => {
      cancelled = true
    }
    // We deliberately exclude `inline` from deps — it's only the URL that triggers refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return state
}
