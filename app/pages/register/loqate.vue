<template>
  <div>
    <SchoolRegistrationForm
      v-model:search-query="searchQuery"
      v-model:form-data="formData"
      provider="Loqate"
      :countries="loqateCountries"
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
          <p>Loqate found a verified version of your address. Which would you like to use?</p>
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

          <!-- Verified -->
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
                Verified
                <span class="verification-level" :class="verificationLevelClass">{{ verificationLevel }}</span>
              </p>
              <p class="option-address">{{ validatedFormattedAddress }}</p>
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
const loqateCountries = staticCountries

// Address Validation state
const showValidationDialog = ref(false)
const validationData = ref<any>(null)
const selectedOption = ref<'original' | 'recommended'>('recommended')
const enteredAddress = ref('')

const validatedFormattedAddress = computed(() => {
  if (!validationData.value) return ''
  const d = validationData.value
  return [
    d.Line1,
    d.Line2,
    [d.City, d.Province, d.PostalCode].filter(Boolean).join(', '),
    d.CountryName,
  ].filter(Boolean).join(', ')
})

const verificationLevel = computed(() => {
  if (!validationData.value) return 'Unverified'
  // The Retrieve endpoint returns data — if we got a match, it's verified
  return 'Suggested'
})

const verificationLevelClass = computed(() => {
  const level = verificationLevel.value
  if (level === 'Suggested') return 'level-verified'
  return 'level-unverified'
})

async function onSearch(query: string) {
  loading.value = true
  noResults.value = false
  errorMessage.value = ''

  try {
    const data = await $fetch<any>('/api/loqate/autocomplete', {
      query: { text: query, country: formData.value.country || undefined },
    })

    if (data?.Items?.length && !data.Items[0].Error) {
      suggestions.value = data.Items.map((item: any) => ({
        label: item.Text || item.Description || '',
        secondary: item.Description || '',
        value: item,
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
  const item = suggestion.value

  // Loqate uses a drill-down model: if Type is not 'Address', we need to
  // search again with the Id to expand the container (e.g. street → addresses)
  if (item.Type !== 'Address') {
    loading.value = true
    try {
      const data = await $fetch<any>('/api/loqate/autocomplete', {
        query: { text: item.Text, country: formData.value.country || undefined },
      })
      if (data?.Items?.length && !data.Items[0].Error) {
        suggestions.value = data.Items.map((i: any) => ({
          label: i.Text || i.Description || '',
          secondary: i.Description || '',
          value: i,
        }))
      }
    } catch {
      errorMessage.value = 'Failed to expand address'
    } finally {
      loading.value = false
    }
    return
  }

  // Type === 'Address' — retrieve full details
  loading.value = true
  try {
    const data = await $fetch<any>('/api/loqate/retrieve', {
      query: { id: item.Id },
    })

    if (data?.Items?.length && !data.Items[0].Error) {
      const addr = data.Items[0]
      formData.value.line1 = addr.Line1 || ''
      formData.value.line2 = addr.Line2 || ''
      formData.value.city = addr.City || ''
      formData.value.state = addr.Province || addr.ProvinceName || ''
      formData.value.postalCode = addr.PostalCode || ''
      if (addr.CountryIso2) {
        formData.value.country = addr.CountryIso2
      }
    }
  } catch (err: any) {
    errorMessage.value = 'Failed to retrieve address details'
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

    const result = await $fetch<any>('/api/loqate/validate-address', {
      method: 'POST',
      body: {
        address: addressLines,
        country: data.country,
      },
    })

    if (result?.verified && result.match) {
      const verified = result.match
      // Check if the address was changed or needs confirmation
      const matchesOriginal = (verified.Line1 || '') === data.line1
        && (verified.PostalCode || '') === (data.postalCode || '')
        && (verified.City || '') === (data.city || '')

      if (!matchesOriginal) {
        validationData.value = verified
        selectedOption.value = 'recommended'
        showValidationDialog.value = true
      } else {
        finalSubmit(data)
      }
    } else {
      finalSubmit(data)
    }
  } catch {
    // If validation fails, allow submission anyway
    finalSubmit(data)
  }
}

function confirmSelection() {
  if (selectedOption.value === 'recommended' && validationData.value) {
    applyRecommended()
  }
  showValidationDialog.value = false
  finalSubmit(formData.value)
}

function applyRecommended() {
  const addr = validationData.value
  if (addr) {
    formData.value.line1 = addr.Line1 || ''
    formData.value.line2 = addr.Line2 || ''
    formData.value.city = addr.City || ''
    formData.value.state = addr.Province || addr.ProvinceName || ''
    formData.value.postalCode = addr.PostalCode || ''
  }
  validationData.value = null
}

function finalSubmit(data: FormData) {
  alert(`Loqate submission:\n${JSON.stringify(data, null, 2)}`)
}

function onCountryChange() {
  suggestions.value = []
  noResults.value = false
  errorMessage.value = ''
  validationData.value = null
  showValidationDialog.value = false
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

.verification-level {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.level-verified {
  background: #dcfce7;
  color: #16a34a;
}

.level-partial {
  background: #fef3c7;
  color: #d97706;
}

.level-changed {
  background: #dbeafe;
  color: #2563eb;
}

.level-unverified {
  background: #f3f4f6;
  color: #6b7280;
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
