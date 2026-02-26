export default defineEventHandler(() => {
  const startTime = performance.now()
  const store = getDataStore()
  const duration_ms = performance.now() - startTime

  return {
    results: store.countries,
    metrics: {
      duration_ms,
      result_count: store.countries.length,
      query_source: 'static_json',
      scan_type: 'memory_index',
    },
  }
})
