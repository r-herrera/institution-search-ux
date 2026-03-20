<script setup lang="ts">
import type { RankingMethod } from '~/composables/useSearch'

interface Props {
  countries: string[]
  cities: string[]
  selectedCountry: string
  selectedCity: string
  searchTerm: string
  rankingMethod: RankingMethod
  isLoadingCountries: boolean
  isLoadingCities: boolean
  isSearching: boolean
  error: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'country-change': [country: string]
  'city-change': [city: string]
  'search-term-change': [term: string]
  'ranking-change': [method: RankingMethod]
  search: []
}>()


const canSearch = computed(() => {
  return (props.searchTerm.trim().length >= 2 || !!props.selectedCountry) && !props.isSearching
})

function handleSearchTermInput(event: Event) {
  emit('search-term-change', (event.target as HTMLInputElement).value)
}

function handleRankingChange(event: Event) {
  emit('ranking-change', (event.target as HTMLSelectElement).value as RankingMethod)
}

function handleCountryChange(event: Event) {
  emit('country-change', (event.target as HTMLSelectElement).value)
}

function handleCityChange(event: Event) {
  emit('city-change', (event.target as HTMLSelectElement).value)
}

function handleSearch() {
  emit('search')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && canSearch.value) {
    emit('search')
  }
}
</script>

<template>
  <div class="search-box" @keydown="handleKeydown">
    <!-- Error -->
    <Transition name="fade">
      <div v-if="error" class="error-banner" role="alert">
        {{ error }}
      </div>
    </Transition>

    <!-- Institution Name Search -->
    <div class="field">
      <label for="search-input">
        Institution Name
      </label>
      <input
        id="search-input"
        type="text"
        :value="searchTerm"
        placeholder='e.g. "university", "school", "college"'
        autocomplete="off"
        @input="handleSearchTermInput"
      />
      <div class="field-hint">Optional when filtering by country. Supports phrases and boolean operators.</div>
    </div>

    <!-- Ranking Method -->
    <div class="field">
      <label for="ranking-select">
        Ranking Method
      </label>
      <select
        id="ranking-select"
        :value="rankingMethod"
        @change="handleRankingChange"
      >
        <option value="websearch">Best Match (Relevance)</option>
        <option value="trgm">Fuzzy Match (Typo-tolerant)</option>
      </select>
    </div>

    <!-- Country -->
    <div class="field">
      <label for="country-select">
        Country
        <span class="optional-tag">optional</span>
      </label>
      <select
        id="country-select"
        :value="selectedCountry"
        :disabled="isLoadingCountries"
        @change="handleCountryChange"
      >
        <option value="">
          {{ isLoadingCountries ? 'Loading countries...' : 'All countries' }}
        </option>
        <option v-for="country in countries" :key="country" :value="country">
          {{ country }}
        </option>
      </select>
    </div>

    <!-- City -->
    <div class="field">
      <label for="city-select">
        City / Town
        <span class="optional-tag">optional</span>
      </label>
      <select
        id="city-select"
        :value="selectedCity"
        :disabled="!selectedCountry || isLoadingCities"
        @change="handleCityChange"
      >
        <option value="">
          {{
            isLoadingCities
              ? 'Loading cities...'
              : !selectedCountry
                ? 'Select a country first'
                : 'All cities'
          }}
        </option>
        <option v-for="city in cities" :key="city" :value="city">
          {{ city }}
        </option>
      </select>
      <div v-if="cities.length > 0 && selectedCountry" class="field-hint">
        {{ cities.length }} cities available
      </div>
    </div>

    <!-- Search Button -->
    <button
      class="search-btn"
      @click="handleSearch"
    >
      <template v-if="isSearching">
        <span class="spinner" />
        Searching...
      </template>
      <template v-else>
        Search
      </template>
    </button>
  </div>
</template>

<style scoped>
.search-box {
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
  padding: 28px;
  width: 100%;
  max-width: 420px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.search-header {
  margin-bottom: 24px;
}

h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.02em;
}

/* Error banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Fields */
.field {
  margin-bottom: 22px;
}

label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.optional-tag {
  font-size: 0.7rem;
  font-weight: 500;
  color: #9ca3af;
  text-transform: lowercase;
  letter-spacing: 0;
  margin-left: 4px;
}

input[type="text"] {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  background: #fff;
  color: #1f2937;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

input[type="text"]::placeholder {
  color: #9ca3af;
}

input[type="text"]:hover {
  border-color: #93c5fd;
}

input[type="text"]:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

select {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.15s ease;
}

select:hover:not(:disabled) {
  border-color: #93c5fd;
}

select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

select:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.field-hint {
  margin-top: 6px;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Search Button */
.search-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 4px;
}

.search-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
}

.search-btn:active:not(:disabled) {
  transform: translateY(0);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
