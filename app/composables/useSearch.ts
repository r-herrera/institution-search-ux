import type {
  Institution,
  QueryMetrics,
  PaginatedSearchResponse,
  RankingMethod,
} from '~/types/search'
import { countries as staticCountries } from '~/utils/countries'
import { citiesByCountry } from '~/utils/cities'

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
   * Load countries from static data
   */
  function fetchCountries() {
    countries.value = staticCountries
    console.log(`[Countries] Loaded ${staticCountries.length} countries (static)`)
  }

  /**
   * Load cities from static data for a given country
   */
  function fetchCities(country: string) {
    if (!country) {
      cities.value = []
      return
    }

    const staticCities = citiesByCountry[country] || []
    cities.value = staticCities
    console.log(`[Cities] Loaded ${staticCities.length} cities for ${country} (static)`)
  }

  /**
   * Execute a paginated search against the API.
   * - If a search term (≥2 chars) is present: uses /api/search/paginated (full-text / trgm)
   * - If only a country is selected: uses /api/search/browse (location browse, no term needed)
   * - If neither: shows an error
   */
  async function search() {
    const term = searchTerm.value.trim()
    const hasTerm = term.length >= 2
    const hasCountry = !!selectedCountry.value

    if (!hasTerm && !hasCountry) {
      error.value = 'Enter a search term or select a country'
      return
    }

    isSearching.value = true
    error.value = null
    results.value = []
    metrics.value = null
    detailedMetrics.value = null
    rankingExplanation.value = ''

    try {
      if (hasTerm) {
        // Full-text / fuzzy search (requires search term)
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

        metrics.value = {
          duration_ms: response.metrics.duration_ms,
          rows_returned: response.metrics.rows_returned,
          query_source: response.metrics.query_source,
          executed_at: response.metrics.executed_at,
          query_type: response.metrics.query_type,
          search_term: response.metrics.search_term,
        }
        detailedMetrics.value = response.metrics

        console.log(`[Search] "${term}" (${rankingMethod.value}) → ${response.meta.total} total, page ${response.meta.current_page}/${response.meta.last_page}, ${response.metrics.duration_ms.toFixed(2)}ms`)
        if (response.metrics.explain) {
          console.log('[Search] EXPLAIN:', JSON.stringify(response.metrics.explain, null, 2))
        }
      } else {
        // Location browse (country required, no search term)
        const params = new URLSearchParams({
          country: selectedCountry.value,
          page: String(currentPage.value),
          limit: String(perPage.value),
        })

        if (selectedCity.value) {
          params.append('city', selectedCity.value)
        }

        const response = await $fetch<PaginatedSearchResponse>(
          `${apiBase}/search/browse?${params}`
        )

        results.value = response.data
        totalResults.value = response.meta.total
        totalPages.value = response.meta.last_page
        currentPage.value = response.meta.current_page
        rankingExplanation.value = response.ranking_explanation
        rankingTechnicalDetail.value = response.ranking_technical_detail || ''
        hasSearched.value = true

        metrics.value = {
          duration_ms: response.metrics.duration_ms,
          rows_returned: response.metrics.rows_returned,
          query_source: response.metrics.query_source,
          executed_at: response.metrics.executed_at,
          query_type: response.metrics.query_type,
          search_term: response.metrics.search_term,
        }
        detailedMetrics.value = response.metrics

        console.log(`[Browse] country="${selectedCountry.value}"${selectedCity.value ? ` city="${selectedCity.value}"` : ''} → ${response.meta.total} total, page ${response.meta.current_page}/${response.meta.last_page}, ${response.metrics.duration_ms.toFixed(2)}ms`)
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
   * Handle country change — reset city, fetch new cities, trigger search
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

    // Trigger search if country is set or a search term is already entered
    if (country || searchTerm.value.trim().length >= 2) {
      search()
    } else {
      // Cleared country and no term — reset results
      results.value = []
      metrics.value = null
      detailedMetrics.value = null
      hasSearched.value = false
    }
  }

  /**
   * Handle city change — re-search with new city filter
   */
  function onCityChange(city: string) {
    selectedCity.value = city
    currentPage.value = 1

    // Re-search if we have something to search with
    if (selectedCountry.value || searchTerm.value.trim().length >= 2) {
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
