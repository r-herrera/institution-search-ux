export default defineEventHandler((event) => {
  const startTime = performance.now()
  const country = decodeURIComponent(getRouterParam(event, 'country') || '')
  const store = getDataStore()

  // Case-insensitive country lookup
  const normalizedCountry = store.countryNormMap.get(country.toLowerCase())
  const cities = normalizedCountry
    ? store.citiesByCountry.get(normalizedCountry) || []
    : []

  const duration_ms = performance.now() - startTime

  return {
    results: cities,
    metrics: {
      duration_ms,
      result_count: cities.length,
      query_source: 'static_json',
      scan_type: 'memory_index',
    },
  }
})
