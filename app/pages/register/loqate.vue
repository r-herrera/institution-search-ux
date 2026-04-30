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
      :show-address-search="true"
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
          <p v-if="verificationStatus === 'verified'">Loqate found a verified version of your address. Which would you like to use?</p>
          <p v-else-if="verificationStatus === 'partial'">Loqate could only partially verify your address (verified to {{ matchLevelLabel }} level). Please review carefully.</p>
          <p v-else>Loqate could not fully verify your address. Please review the suggested match.</p>
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

    <!-- Unverified/Ambiguous Warning Modal -->
    <div
      v-if="showUnverifiedDialog"
      class="modal-overlay"
      @click.self="dismissUnverifiedDialog"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>Address could not be verified</h3>
          <p v-if="verificationStatus === 'ambiguous'">
            Loqate found multiple possible matches for your address. Please check your address details are correct before continuing.
          </p>
          <p v-else>
            Loqate was unable to verify this address. It may be incomplete or contain errors. Please review your input.
          </p>
        </div>

        <div class="modal-body">
          <div class="unverified-address-display">
            <p class="option-label">
              Your address
              <span class="verification-level level-unverified">{{ verificationLevel }}</span>
            </p>
            <p class="option-address">{{ enteredAddress }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-outline" @click="dismissUnverifiedDialog">
            Edit address
          </button>
          <button class="btn-primary btn-warning" @click="submitAnyway">
            Submit anyway
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Suggestion, FormData } from '~/components/SchoolRegistrationForm.vue'
import { registrationCountries as staticCountries } from '~/utils/registration-countries'

const formData = ref<FormData>({
  country: '', line1: '', line2: '', city: '', state: '', postalCode: '',
  schoolName: '', schoolWebsite: '', telephone: '',
})
const loqateCountries = staticCountries

// Autocomplete state
const searchQuery = ref('')
const suggestions = ref<Suggestion[]>([])
const loading = ref(false)
const noResults = ref(false)
const errorMessage = ref('')
const containerId = ref<string | null>(null)

async function onSearch(query: string) {
  // When user types new text, reset drill-down container
  containerId.value = null
  await doFind(query)
}

async function doFind(query: string) {
  loading.value = true
  noResults.value = false
  errorMessage.value = ''

  try {
    const params: Record<string, string> = {
      text: query,
    }
    if (formData.value.country) {
      params.country = formData.value.country
    }
    if (containerId.value) {
      params.container = containerId.value
    }

    const data = await $fetch<any>('/api/loqate/autocomplete', { query: params })

    const items = data?.Items || []
    if (items.length > 0) {
      suggestions.value = items.map((item: any) => ({
        label: item.Text,
        secondary: item.Description,
        value: { id: item.Id, type: item.Type, text: item.Text },
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
  const { id, type } = suggestion.value

  if (type !== 'Address') {
    // Drill-down: this is a container (e.g. street, building)
    // Call Find again scoped to this container
    containerId.value = id
    searchQuery.value = suggestion.value.text
    await doFind(suggestion.value.text)
    return
  }

  // Leaf address — retrieve full details
  loading.value = true
  try {
    const data = await $fetch<any>('/api/loqate/retrieve', { query: { id } })
    const addr = data?.Items?.[0]
    if (addr) {
      formData.value.line1 = addr.Line1 || ''
      formData.value.line2 = addr.Line2 || ''
      formData.value.city = addr.City || ''
      formData.value.state = addr.Province || addr.ProvinceName || ''
      formData.value.postalCode = addr.PostalCode || ''
    }
    suggestions.value = []
    searchQuery.value = ''
    containerId.value = null
  } catch (err: any) {
    errorMessage.value = 'Failed to retrieve address details'
  } finally {
    loading.value = false
  }
}

// Address Validation state
const showValidationDialog = ref(false)
const validationData = ref<any>(null)
const selectedOption = ref<'original' | 'recommended'>('recommended')
const enteredAddress = ref('')

// Unverified/ambiguous warning dialog state
const showUnverifiedDialog = ref(false)
const pendingSubmitData = ref<FormData | null>(null)

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

const verificationStatus = ref<string>('unverified')
const matchLevel = ref(0)

const matchLevelLabel = computed(() => {
  const labels: Record<number, string> = {
    5: 'delivery point',
    4: 'premise',
    3: 'thoroughfare',
    2: 'locality',
    1: 'administrative area',
    0: 'none',
  }
  return labels[matchLevel.value] || 'none'
})

const verificationLevel = computed(() => {
  if (verificationStatus.value === 'verified') return 'Verified'
  if (verificationStatus.value === 'partial') return 'Partially Verified'
  if (verificationStatus.value === 'ambiguous') return 'Ambiguous'
  return 'Unverified'
})

const verificationLevelClass = computed(() => {
  const level = verificationLevel.value
  if (level === 'Verified') return 'level-verified'
  if (level === 'Partially Verified') return 'level-partial'
  return 'level-unverified'
})

async function onSubmit(data: FormData) {
  if (!data.line1) {
    finalSubmit(data)
    return
  }

  enteredAddress.value = [
    data.line1,
    data.line2,
    [data.city, data.state, data.postalCode].filter(Boolean).join(', '),
  ].filter(Boolean).join(', ')

  try {
    const addressLines = [data.line1]
    if (data.line2) addressLines.push(data.line2)

    const result = await $fetch<any>('/api/loqate/validate-address', {
      method: 'POST',
      body: {
        address: addressLines,
        country: data.country,
        locality: data.city || '',
        administrativeArea: data.state || '',
        postalCode: data.postalCode || '',
      },
    })

    const status = result?.verificationStatus || 'unverified'
    verificationStatus.value = status
    matchLevel.value = result?.matchLevel ?? 0

    if ((status === 'verified' || status === 'partial') && result.match) {
      const verified = result.match

      if (status === 'verified') {
        // Fully verified — skip dialog if nothing changed
        const matchesOriginal = (verified.Line1 || '') === data.line1
          && (verified.Line2 || '') === (data.line2 || '')
          && (verified.PostalCode || '') === (data.postalCode || '')
          && (verified.City || '') === (data.city || '')
          && (verified.Province || '') === (data.state || '')

        if (matchesOriginal) {
          finalSubmit(data)
          return
        }
      }

      // Show dialog for verified-with-changes and partial matches
      validationData.value = verified
      selectedOption.value = status === 'verified' ? 'recommended' : 'original'
      showValidationDialog.value = true
    } else {
      // Ambiguous, reverted, or unverified — show warning dialog
      pendingSubmitData.value = data
      showUnverifiedDialog.value = true
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

function dismissUnverifiedDialog() {
  showUnverifiedDialog.value = false
  pendingSubmitData.value = null
}

function submitAnyway() {
  showUnverifiedDialog.value = false
  if (pendingSubmitData.value) {
    finalSubmit(pendingSubmitData.value)
  }
  pendingSubmitData.value = null
}

function onCountryChange() {
  validationData.value = null
  showValidationDialog.value = false
  showUnverifiedDialog.value = false
  // Reset autocomplete state
  searchQuery.value = ''
  suggestions.value = []
  containerId.value = null
  noResults.value = false
  errorMessage.value = ''
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

.btn-warning {
  background: #d97706;
}

.btn-warning:hover {
  background: #b45309;
}

.unverified-address-display {
  padding: 14px;
  border: 1.5px solid #fde68a;
  border-radius: 10px;
  background: #fffbeb;
}
</style>
