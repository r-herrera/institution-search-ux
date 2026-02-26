export default defineEventHandler((event) => {
  const startTime = performance.now()
  const query = getQuery(event)

  const country = ((query.country as string) || '').trim()
  const city = ((query.city as string) || '').trim()
  const limit = Math.min(Math.max(parseInt(query.limit as string) || 25, 1), 200)

  if (!country) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Country parameter is required',
    })
  }

  const store = getDataStore()
  const countryLower = country.toLowerCase()
  const cityLower = city.toLowerCase()

  // Filter institutions
  const filtered: typeof store.institutions = []
  let totalMatches = 0

  for (const inst of store.institutions) {
    if (!inst.country) continue
    if (!inst.country.toLowerCase().includes(countryLower)) continue
    if (cityLower && (!inst.city || !inst.city.toLowerCase().includes(cityLower))) continue

    totalMatches++
    if (filtered.length < limit) {
      filtered.push(inst)
    }
  }

  // Sort results alphabetically by name
  filtered.sort((a, b) =>
    (a.organisation_name || '').localeCompare(b.organisation_name || '')
  )

  const duration_ms = performance.now() - startTime

  return {
    results: filtered,
    total_matches: totalMatches,
    metrics: {
      duration_ms,
      result_count: filtered.length,
      query_source: 'static_json',
      scan_type: 'memory_filter',
    },
  }
})
