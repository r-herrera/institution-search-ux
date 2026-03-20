<template>
  <div>
    <SchoolRegistrationForm
      v-model:search-query="searchQuery"
      v-model:form-data="formData"
      provider="Google Places (New)"
      :countries="googleCountries"
      :suggestions="suggestions"
      :loading="loading"
      :no-results="noResults"
      :error-message="errorMessage"
      :address-confirmation="true"
      @search="onSearch"
      @select-suggestion="onSelect"
      @country-change="onCountryChange"
      @submit="onSubmit"
    />

    <!-- Address Validation Modal -->
    <div
      v-if="showValidationDialog"
      class="modal-overlay"
      @click.self="showValidationDialog = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>Confirm your address</h3>
          <p>We found a more complete version of your address. Which would you like to use?</p>
        </div>

        <div class="modal-body">
          <!-- What you entered -->
          <label
            class="address-option"
            :class="{ selected: selectedOption === 'original' }"
          >
            <input
              v-model="selectedOption"
              type="radio"
              value="original"
            />
            <div>
              <p class="option-label">What you entered</p>
              <p class="option-address">{{ enteredAddress }}</p>
            </div>
          </label>

          <!-- Recommended -->
          <label
            class="address-option"
            :class="{ selected: selectedOption === 'recommended' }"
          >
            <input
              v-model="selectedOption"
              type="radio"
              value="recommended"
            />
            <div>
              <p class="option-label">
                Recommended
                <span class="suggested-badge">Suggested</span>
              </p>
              <p class="option-address">{{ validationResult?.formattedAddress }}</p>
            </div>
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn-outline" @click="showValidationDialog = false">
            Edit address
          </button>
          <button class="btn-primary" @click="confirmSelection">
            Use this address
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Suggestion, FormData } from '~/components/SchoolRegistrationForm.vue'
import { registrationCountries as staticCountries } from '~/utils/registration-countries'

const searchQuery = ref('')
const formData = ref<FormData>({
  country: '', line1: '', line2: '', city: '', state: '', postalCode: '',
  schoolName: '', schoolWebsite: '', telephone: '',
})
const suggestions = ref<Suggestion[]>([])
const loading = ref(false)
const noResults = ref(false)
const errorMessage = ref('')
const googleCountries = staticCountries
const sessionToken = ref(crypto.randomUUID())

// Address Validation state
const showValidationDialog = ref(false)
const validationResult = ref<any>(null)
const selectedOption = ref<'original' | 'recommended'>('recommended')
const enteredAddress = ref('')

async function onSearch(query: string) {
  loading.value = true
  noResults.value = false
  errorMessage.value = ''

  try {
    const data = await $fetch<any>('/api/google/autocomplete', {
      method: 'POST',
      body: {
        input: query,
        regionCode: formData.value.country || undefined,
        sessionToken: sessionToken.value,
      },
    })

    if (data?.suggestions?.length) {
      suggestions.value = data.suggestions.map((s: any) => ({
        label: s.placePrediction?.text?.text || s.placePrediction?.structuredFormat?.mainText?.text || '',
        secondary: s.placePrediction?.structuredFormat?.secondaryText?.text || '',
        value: s.placePrediction,
      }))
    } else {
      suggestions.value = []
      noResults.value = true
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Failed to search addresses'
    suggestions.value = []
  } finally {
    loading.value = false
  }
}

async function onSelect(suggestion: Suggestion) {
  const placeId = suggestion.value?.placeId
  if (!placeId) return

  loading.value = true
  try {
    const data = await $fetch<any>('/api/google/place-details', {
      query: { placeId },
    })

    if (data?.addressComponents) {
      const components = data.addressComponents as any[]
      const get = (type: string) => components.find((c: any) => c.types?.includes(type))

      const streetNumber = get('street_number')?.longText || ''
      const route = get('route')?.longText || ''
      formData.value.line1 = [streetNumber, route].filter(Boolean).join(' ')
      formData.value.line2 = get('subpremise')?.longText || ''
      formData.value.city = get('locality')?.longText || get('postal_town')?.longText || ''
      formData.value.state = get('administrative_area_level_1')?.longText || ''
      formData.value.postalCode = get('postal_code')?.longText || ''
    }

    sessionToken.value = crypto.randomUUID()
  } catch (err: any) {
    errorMessage.value = 'Failed to retrieve place details'
  } finally {
    loading.value = false
  }
}

async function onSubmit(data: FormData) {
  if (!data.line1) {
    finalSubmit(data)
    return
  }

  errorMessage.value = ''

  enteredAddress.value = [
    data.line1,
    data.line2,
    [data.city, data.state, data.postalCode].filter(Boolean).join(', '),
  ].filter(Boolean).join(', ')

  try {
    const addressLines = [data.line1]
    if (data.line2) addressLines.push(data.line2)
    addressLines.push([data.city, data.state, data.postalCode].filter(Boolean).join(', '))

    const result = await $fetch<any>('/api/google/validate-address', {
      method: 'POST',
      body: {
        regionCode: data.country,
        addressLines,
      },
    })

    const verdict = result?.result?.verdict
    if (verdict?.hasUnconfirmedComponents || verdict?.hasInferredComponents || verdict?.hasReplacedComponents) {
      validationResult.value = {
        formattedAddress: result.result.address?.formattedAddress || '',
        components: result.result.address?.addressComponents || [],
        verdict,
      }
      selectedOption.value = 'recommended'
      showValidationDialog.value = true
    } else {
      finalSubmit(data)
    }
  } catch {
    finalSubmit(data)
  }
}

function confirmSelection() {
  if (selectedOption.value === 'recommended' && validationResult.value) {
    applyRecommended()
  }
  showValidationDialog.value = false
  finalSubmit(formData.value)
}

function applyRecommended() {
  const components = validationResult.value?.components as any[]
  if (components?.length) {
    const get = (type: string) => components.find((c: any) => c.componentType === type)
    const streetNumber = get('street_number')?.componentName?.text || ''
    const route = get('route')?.componentName?.text || ''
    formData.value.line1 = [streetNumber, route].filter(Boolean).join(' ')
    formData.value.line2 = get('subpremise')?.componentName?.text || ''
    formData.value.city = get('locality')?.componentName?.text || ''
    formData.value.state = get('administrative_area_level_1')?.componentName?.text || ''
    formData.value.postalCode = get('postal_code')?.componentName?.text || ''
  }
  validationResult.value = null
}

function finalSubmit(data: FormData) {
  alert(`Google Places submission:\n${JSON.stringify(data, null, 2)}`)
}

function onCountryChange() {
  suggestions.value = []
  noResults.value = false
  errorMessage.value = ''
  validationResult.value = null
  showValidationDialog.value = false
  sessionToken.value = crypto.randomUUID()
}
</script>

<style scoped>
/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 520px;
  width: 100%;
  margin: 0 16px;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
}

.modal-header p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.address-option:hover {
  border-color: #93c5fd;
}

.address-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.address-option input[type="radio"] {
  margin-top: 3px;
  accent-color: #2563eb;
}

.option-label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
}

.suggested-badge {
  font-size: 0.7rem;
  font-weight: 600;
  background: #dbeafe;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: 10px;
}

.option-address {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-outline {
  padding: 9px 18px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-outline:hover {
  border-color: #93c5fd;
  color: #2563eb;
}

.btn-primary {
  padding: 9px 18px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
