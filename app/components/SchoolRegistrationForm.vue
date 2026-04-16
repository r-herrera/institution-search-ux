<template>
  <form class="reg-card" @submit.prevent="$emit('submit', formData)">
    <h2 class="reg-title">{{ provider }} — School Registration</h2>

    <p v-if="addressConfirmation" class="confirmation-badge confirmed">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
      Address Confirmation available
    </p>
    <p v-else class="confirmation-badge not-confirmed">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
      Address Confirmation not available
    </p>

    <!-- Country -->
    <div class="field">
      <label for="reg-country">Country</label>
      <select
        id="reg-country"
        :value="formData.country"
        @change="onCountryChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="">Select a country first</option>
        <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.name }}</option>
      </select>
    </div>

    <!-- Address Search -->
    <template v-if="showAddressSearch">
      <div class="field">
        <label for="reg-address-search">Address Search</label>
        <div class="autocomplete-wrapper">
          <input
            id="reg-address-search"
            type="text"
            :value="searchQuery"
            placeholder="Start typing an address..."
            :disabled="!formData.country"
            autocomplete="off"
            @input="onSearchInput"
            @focus="showSuggestions = true"
          />
          <div v-if="loading" class="input-spinner" />
          <div
            v-if="showSuggestions && suggestions.length > 0"
            class="suggestions-dropdown"
          >
            <button
              v-for="(suggestion, index) in suggestions"
              :key="index"
              type="button"
              class="suggestion-item"
              @click="onSelectSuggestion(suggestion)"
            >
              {{ suggestion.label }}
              <span v-if="suggestion.secondary" class="suggestion-secondary">{{ suggestion.secondary }}</span>
            </button>
          </div>
        </div>
      </div>

      <p v-if="noResults" class="field-warning">
        No results found — you can enter the address manually below.
      </p>

      <p v-if="errorMessage" class="field-error">
        {{ errorMessage }}
      </p>
    </template>

    <!-- Address Line 1 -->
    <div class="field">
      <label for="reg-line1">Address Line 1</label>
      <input id="reg-line1" v-model="formData.line1" type="text" placeholder="Address Line 1" />
    </div>

    <!-- Address Line 2 -->
    <div class="field">
      <label for="reg-line2">Address Line 2 <span class="optional-tag">optional</span></label>
      <input id="reg-line2" v-model="formData.line2" type="text" placeholder="Address Line 2" />
    </div>

    <!-- City / Town -->
    <div class="field">
      <label for="reg-city">City / Town</label>
      <input id="reg-city" v-model="formData.city" type="text" placeholder="City / Town" />
    </div>

    <!-- State / County / Region -->
    <div class="field">
      <label for="reg-state">State / County / Region</label>
      <input id="reg-state" v-model="formData.state" type="text" placeholder="State / County / Region" />
    </div>

    <!-- Postal / Zip Code -->
    <div class="field">
      <label for="reg-postal">Postal / Zip Code</label>
      <input id="reg-postal" v-model="formData.postalCode" type="text" placeholder="Postal / Zip Code" />
    </div>

    <hr class="divider" />

    <!-- School Name -->
    <div class="field">
      <label for="reg-school-name">School Name</label>
      <input id="reg-school-name" v-model="formData.schoolName" type="text" placeholder="School Name" />
    </div>

    <!-- School Website URL -->
    <div class="field">
      <label for="reg-website">School Website URL</label>
      <input id="reg-website" v-model="formData.schoolWebsite" type="url" placeholder="https://..." />
    </div>

    <!-- Telephone Number -->
    <div class="field">
      <label for="reg-tel">Telephone Number</label>
      <input id="reg-tel" v-model="formData.telephone" type="tel" placeholder="Telephone Number" />
    </div>

    <slot name="before-submit" :form-data="formData" />

    <button type="submit" class="submit-btn">
      Submit Registration
    </button>
  </form>
</template>

<script setup lang="ts">
export interface Suggestion {
  label: string
  secondary?: string
  value: any
}

export interface FormData {
  country: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  schoolName: string
  schoolWebsite: string
  telephone: string
}

const props = defineProps<{
  provider: string
  countries: { code: string; name: string }[]
  suggestions?: Suggestion[]
  loading?: boolean
  noResults?: boolean
  errorMessage?: string
  addressConfirmation?: boolean
  showAddressSearch?: boolean
}>()

const showAddressSearch = computed(() => props.showAddressSearch !== false)

const emit = defineEmits<{
  search: [query: string]
  'select-suggestion': [suggestion: Suggestion]
  'country-change': [code: string]
  submit: [data: FormData]
}>()

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const showSuggestions = ref(true)

const formData = defineModel<FormData>('formData', {
  default: () => ({
    country: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    schoolName: '',
    schoolWebsite: '',
    telephone: '',
  }),
})

let debounceTimer: ReturnType<typeof setTimeout>

function onSearchInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  searchQuery.value = value
  clearTimeout(debounceTimer)
  showSuggestions.value = true
  debounceTimer = setTimeout(() => {
    if (value.length >= 2) {
      emit('search', value)
    }
  }, 300)
}

function onSelectSuggestion(suggestion: Suggestion) {
  showSuggestions.value = false
  emit('select-suggestion', suggestion)
}

function onCountryChange(code: string) {
  formData.value.country = code
  searchQuery.value = ''
  emit('country-change', code)
}

// Close suggestions on click outside
if (import.meta.client) {
  document.addEventListener('click', () => {
    showSuggestions.value = false
  })
}
</script>

<style scoped>
.reg-card {
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
  padding: 28px;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.reg-title {
  margin: 0 0 16px;
  font-size: 1.35rem;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.02em;
}

.confirmation-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  margin: 0 0 20px;
}

.confirmation-badge.confirmed {
  color: #16a34a;
}

.confirmation-badge.not-confirmed {
  color: #9ca3af;
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

input[type="text"],
input[type="url"],
input[type="tel"] {
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

input::placeholder {
  color: #9ca3af;
}

input:hover:not(:disabled) {
  border-color: #93c5fd;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
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

/* Autocomplete */
.autocomplete-wrapper {
  position: relative;
}

.input-spinner {
  position: absolute;
  top: 50%;
  right: 14px;
  width: 16px;
  height: 16px;
  margin-top: -8px;
  border: 2px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.suggestions-dropdown {
  position: absolute;
  z-index: 50;
  margin-top: 4px;
  width: 100%;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 240px;
  overflow-y: auto;
}

.suggestion-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-family: inherit;
  color: #1f2937;
  background: none;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.1s;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: #f0f5ff;
}

.suggestion-secondary {
  display: block;
  font-size: 0.78rem;
  color: #9ca3af;
  margin-top: 2px;
}

/* Warning / Error messages */
.field-warning {
  font-size: 0.85rem;
  color: #d97706;
  margin: -8px 0 16px;
}

.field-error {
  font-size: 0.85rem;
  color: #dc2626;
  margin: -8px 0 16px;
}

.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 24px 0;
}

/* Submit button */
.submit-btn {
  display: block;
  width: 100%;
  padding: 12px 24px;
  background: #2563eb;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 8px;
}

.submit-btn:hover {
  background: #1d4ed8;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.submit-btn:active {
  transform: scale(0.98);
}
</style>
