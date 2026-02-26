interface Institution {
  id: number
  organisation_name: string
  city: string | null
  country: string | null
  street_1?: string | null
  street_2?: string | null
  website?: string | null
}

interface QueryMetrics {
  duration_ms: number
  result_count: number
  query_source: string
  scan_type?: string
  index_used?: string
}

interface SearchResponse {
  results: Institution[]
  total_matches: number
  metrics: QueryMetrics
}

interface LocationResponse {
  results: string[]
  metrics: QueryMetrics
}

export function useSearch() {
  const countries = ref<string[]>([])
  const cities = ref<string[]>([])
  const results = ref<Institution[]>([])
  const metrics = ref<QueryMetrics | null>(null)
  const totalMatches = ref(0)

  const isLoadingCountries = ref(false)
  const isLoadingCities = ref(false)
  const isSearching = ref(false)
  const error = ref<string | null>(null)
  const hasSearched = ref(false)

  const selectedCountry = ref('')
  const selectedCity = ref('')

  async function fetchCountries() {
    isLoadingCountries.value = true
    error.value = null

    try {
      const response = await $fetch<LocationResponse>('/api/locations/countries')
      countries.value = response.results
    } catch (e: any) {
      error.value = e.message || 'Failed to load countries'
      console.error('[Countries] Error:', e)
    } finally {
      isLoadingCountries.value = false
    }
  }

  async function fetchCities(country: string) {
    if (!country) {
      cities.value = []
      return
    }

    isLoadingCities.value = true
    error.value = null

    try {
      const response = await $fetch<LocationResponse>(
        `/api/locations/cities/${encodeURIComponent(country)}`
      )
      cities.value = response.results
    } catch (e: any) {
      error.value = e.message || 'Failed to load cities'
      console.error('[Cities] Error:', e)
    } finally {
      isLoadingCities.value = false
    }
  }

  async function search() {
    if (!selectedCountry.value) {
      error.value = 'Please select a country'
      return
    }

    isSearching.value = true
    error.value = null
    results.value = []
    metrics.value = null
    totalMatches.value = 0

    try {
      const params = new URLSearchParams({
        country: selectedCountry.value,
        limit: '25',
      })

      if (selectedCity.value) {
        params.append('city', selectedCity.value)
      }

      const response = await $fetch<SearchResponse>(`/api/locations/search?${params}`)
      results.value = response.results
      metrics.value = response.metrics
      totalMatches.value = response.total_matches
      hasSearched.value = true
    } catch (e: any) {
      error.value = e.message || 'Search failed'
      console.error('[Search] Error:', e)
    } finally {
      isSearching.value = false
    }
  }

  function onCountryChange(country: string) {
    selectedCountry.value = country
    selectedCity.value = ''
    results.value = []
    metrics.value = null
    totalMatches.value = 0
    hasSearched.value = false

    if (country) {
      fetchCities(country)
    } else {
      cities.value = []
    }
  }

  function onCityChange(city: string) {
    selectedCity.value = city
  }

  function reset() {
    selectedCountry.value = ''
    selectedCity.value = ''
    cities.value = []
    results.value = []
    metrics.value = null
    totalMatches.value = 0
    error.value = null
    hasSearched.value = false
  }

  return {
    countries,
    cities,
    results,
    metrics,
    totalMatches,
    selectedCountry,
    selectedCity,
    isLoadingCountries,
    isLoadingCities,
    isSearching,
    error,
    hasSearched,
    fetchCountries,
    fetchCities,
    search,
    onCountryChange,
    onCityChange,
    reset,
  }
}
