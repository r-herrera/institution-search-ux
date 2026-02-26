<script setup lang="ts">
const {
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
  search,
  onCountryChange,
  onCityChange,
} = useSearch()

onMounted(() => {
  fetchCountries()
})
</script>

<template>
  <div class="page">
    <!-- Top bar -->
    <header class="top-bar">
      <div class="top-bar-inner">
        <div class="logo">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>Institution Search</span>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="main-content">
      <div class="content-grid">
        <SearchBox
          :countries="countries"
          :cities="cities"
          :selected-country="selectedCountry"
          :selected-city="selectedCity"
          :is-loading-countries="isLoadingCountries"
          :is-loading-cities="isLoadingCities"
          :is-searching="isSearching"
          :error="error"
          @country-change="onCountryChange"
          @city-change="onCityChange"
          @search="search"
        />

        <ResultsList
          :results="results"
          :metrics="metrics"
          :total-matches="totalMatches"
          :is-searching="isSearching"
          :has-searched="hasSearched"
        />
      </div>
    </main>

    <!-- Footer -->
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Top bar */
.top-bar {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.top-bar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.05rem;
  color: #1a1a2e;
}

.logo svg {
  color: #7c3aed;
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #7c3aed;
  background: #ede9fe;
  padding: 4px 12px;
  border-radius: 20px;
}

/* Main content */
.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 40px 24px;
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  width: 100%;
  max-width: 640px;
}

@media (min-width: 1024px) {
  .content-grid {
    flex-direction: row;
    align-items: flex-start;
    max-width: 1120px;
  }
}

/* Footer */
.footer {
  text-align: center;
  padding: 20px 24px;
  color: #9ca3af;
  font-size: 0.8rem;
}

.footer p {
  margin: 0;
}
</style>
