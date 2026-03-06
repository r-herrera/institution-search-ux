import type {
  Institution,
  QueryMetrics,
  PaginatedSearchResponse,
  LocationResponse,
  RankingMethod,
} from '~/types/search'

export type { RankingMethod }

export function useSearch() {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  // Location state
  const countries = ref<string[]>([])
  const cities = ref<string[]>([])
  const selectedCountry = ref('')
  const selectedCity = ref('')

  // Search state
  const searchTerm = ref('')
  const rankingMethod = ref<RankingMethod>('websearch')
  const results = ref<Institution[]>([])
  const rankingExplanation = ref('')
  const rankingTechnicalDetail = ref('')

  // Pagination state
  const currentPage = ref(1)
  const totalPages = ref(0)
  const perPage = ref(25)
  const totalResults = ref(0)

  // Metrics state
  const metrics = ref<QueryMetrics | null>(null)
  const detailedMetrics = ref<QueryMetrics | null>(null)

  // Loading / error state
  const isLoadingCountries = ref(false)
  const isLoadingCities = ref(false)
  const isSearching = ref(false)
  const error = ref<string | null>(null)
  const hasSearched = ref(false)

  /**
   * Fetch all distinct countries from the API
   */
  async function fetchCountries() {
    isLoadingCountries.value = true
    error.value = null

    try {
      const response = await $fetch<LocationResponse>(`${apiBase}/locations/countries`)
      countries.value = response.results
      console.log(`[Countries] Loaded ${response.results.length} countries in ${response.metrics.duration_ms.toFixed(2)}ms`)
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Failed to load countries'
      console.error('[Countries] Error:', e)
    } finally {
      isLoadingCountries.value = false
    }
  }

  /**
   * Fetch cities for a given country
   */
  async function fetchCities(country: string) {
    if (!country) {
      cities.value = []
      return
    }

    isLoadingCities.value = true
    error.value = null

    try {
      const response = await $fetch<LocationResponse>(
        `${apiBase}/locations/cities/${encodeURIComponent(country)}`
      )
      cities.value = response.results
      console.log(`[Cities] Loaded ${response.results.length} cities for ${country} in ${response.metrics.duration_ms.toFixed(2)}ms`)
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Failed to load cities'
      console.error('[Cities] Error:', e)
    } finally {
      isLoadingCities.value = false
    }
  }

  /**
   * Execute a paginated search against the API
   */
  async function search() {
    const term = searchTerm.value.trim()
    if (!term || term.length < 2) {
      error.value = 'Please enter at least 2 characters to search'
      return
    }

    isSearching.value = true
    error.value = null
    results.value = []
    metrics.value = null
    detailedMetrics.value = null
    rankingExplanation.value = ''

    try {
      const params = new URLSearchParams({
        q: term,
        method: rankingMethod.value,
        page: String(currentPage.value),
        limit: String(perPage.value),
      })

      if (selectedCountry.value) {
        params.append('country', selectedCountry.value)
      }
      if (selectedCity.value) {
        params.append('city', selectedCity.value)
      }

      const response = await $fetch<PaginatedSearchResponse>(
        `${apiBase}/search/paginated?${params}`
      )

      results.value = response.data
      totalResults.value = response.meta.total
      totalPages.value = response.meta.last_page
      currentPage.value = response.meta.current_page
      rankingExplanation.value = response.ranking_explanation
      rankingTechnicalDetail.value = response.ranking_technical_detail || ''
      hasSearched.value = true

      // Build a simple metrics object for the metrics bar
      metrics.value = {
        duration_ms: response.metrics.duration_ms,
        rows_returned: response.metrics.rows_returned,
        query_source: response.metrics.query_source,
        executed_at: response.metrics.executed_at,
        query_type: response.metrics.query_type,
        search_term: response.metrics.search_term,
      }

      // Store full metrics including explain for the detail panel
      detailedMetrics.value = response.metrics

      // Console log full metrics for debugging
      console.log(`[Search] "${term}" (${rankingMethod.value}) → ${response.meta.total} total, page ${response.meta.current_page}/${response.meta.last_page}, ${response.metrics.duration_ms.toFixed(2)}ms`)
      console.log('[Search] Full Metrics:', JSON.stringify(response.metrics, null, 2))
      if (response.metrics.explain) {
        console.log('[Search] EXPLAIN:', JSON.stringify(response.metrics.explain, null, 2))
      }
    } catch (e: any) {
      error.value = e.data?.error || e.data?.message || e.message || 'Search failed'
      console.error('[Search] Error:', e)
    } finally {
      isSearching.value = false
    }
  }

  /**
   * Navigate to a specific page
   */
  function goToPage(page: number) {
    if (page < 1 || page > totalPages.value || page === currentPage.value) return
    currentPage.value = page
    search()
  }

  /**
   * Handle ranking method change — reset to page 1 and re-search
   */
  function onRankingChange(method: RankingMethod) {
    rankingMethod.value = method
    if (hasSearched.value && searchTerm.value.trim().length >= 2) {
      currentPage.value = 1
      search()
    }
  }

  /**
   * Handle country change — reset city, fetch new cities, and re-search if applicable
   */
  function onCountryChange(country: string) {
    selectedCountry.value = country
    selectedCity.value = ''
    currentPage.value = 1

    if (country) {
      fetchCities(country)
    } else {
      cities.value = []
    }

    // Auto re-search if user has already searched
    if (hasSearched.value && searchTerm.value.trim().length >= 2) {
      search()
    }
  }

  /**
   * Handle city change — re-search with new city filter
   */
  function onCityChange(city: string) {
    selectedCity.value = city
    currentPage.value = 1

    // Auto re-search if user has already searched
    if (hasSearched.value && searchTerm.value.trim().length >= 2) {
      search()
    }
  }

  /**
   * Handle search term input
   */
  function onSearchTermChange(term: string) {
    searchTerm.value = term
  }

  /**
   * Reset all state
   */
  function reset() {
    searchTerm.value = ''
    rankingMethod.value = 'websearch'
    selectedCountry.value = ''
    selectedCity.value = ''
    cities.value = []
    results.value = []
    metrics.value = null
    detailedMetrics.value = null
    rankingExplanation.value = ''
    rankingTechnicalDetail.value = ''
    totalResults.value = 0
    totalPages.value = 0
    currentPage.value = 1
    error.value = null
    hasSearched.value = false
  }

  return {
    // Location state
    countries,
    cities,
    selectedCountry,
    selectedCity,

    // Search state
    searchTerm,
    rankingMethod,
    results,
    rankingExplanation,
    rankingTechnicalDetail,

    // Pagination state
    currentPage,
    totalPages,
    perPage,
    totalResults,

    // Metrics
    metrics,
    detailedMetrics,

    // Loading / error
    isLoadingCountries,
    isLoadingCities,
    isSearching,
    error,
    hasSearched,

    // Actions
    fetchCountries,
    fetchCities,
    search,
    goToPage,
    onRankingChange,
    onCountryChange,
    onCityChange,
    onSearchTermChange,
    reset,
  }
}
