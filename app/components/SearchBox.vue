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
    <!-- Header -->
    <div class="search-header">
      <div class="header-icon">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" stroke-linecap="round" />
        </svg>
      </div>
      <h2>Find Institutions</h2>
    </div>

    <!-- Error -->
    <Transition name="fade">
      <div v-if="error" class="error-banner" role="alert">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </Transition>

    <!-- Institution Name Search -->
    <div class="field">
      <label for="search-input">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" stroke-linecap="round" />
        </svg>
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
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Ranking Method
      </label>
      <div class="select-wrapper">
        <select
          id="ranking-select"
          :value="rankingMethod"
          @change="handleRankingChange"
        >
          <option value="websearch">Best Match (Relevance)</option>
          <option value="trgm">Fuzzy Match (Typo-tolerant)</option>
        </select>
        <div class="select-arrow">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Country -->
    <div class="field">
      <label for="country-select">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        Country
        <span class="optional-tag">optional</span>
      </label>
      <div class="select-wrapper">
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
        <div class="select-arrow">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>

    <!-- City -->
    <div class="field">
      <label for="city-select">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        City / Town
        <span class="optional-tag">optional</span>
      </label>

      <div class="select-wrapper">
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
        <div class="select-arrow">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      <div v-if="cities.length > 0 && selectedCountry" class="field-hint">
        {{ cities.length }} cities available
      </div>
    </div>

    <!-- Search Button -->
    <button
      class="search-btn"
      :disabled="!canSearch"
      @click="handleSearch"
    >
      <template v-if="isSearching">
        <span class="spinner" />
        Searching...
      </template>
      <template v-else>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" stroke-linecap="round" />
        </svg>
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
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  flex-shrink: 0;
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
  margin-bottom: 18px;
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

.select-wrapper {
  position: relative;
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
  border-color: #c4b5fd;
}

input[type="text"]:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

select {
  width: 100%;
  padding: 11px 36px 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.15s ease;
  appearance: none;
  -webkit-appearance: none;
}

select:hover:not(:disabled) {
  border-color: #c4b5fd;
}

select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

select:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
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
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
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
