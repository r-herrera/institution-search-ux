<template>
  <div>
    <SchoolRegistrationForm
      v-model:form-data="formData"
      provider="Loqate"
      :countries="loqateCountries"
      :show-address-search="false"
      :address-confirmation="true"
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
import type { FormData } from '~/components/SchoolRegistrationForm.vue'
import { registrationCountries as staticCountries } from '~/utils/registration-countries'

const formData = ref<FormData>({
  country: '', line1: '', line2: '', city: '', state: '', postalCode: '',
  schoolName: '', schoolWebsite: '', telephone: '',
})
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
  const avc = validationData.value.AVC as string | undefined
  if (!avc) return 'Verified'
  // AVC format: V/P/I/U followed by premise/thoroughfare/locality/postcode match levels
  // V = Verified, P = Partially verified, I = Interaction needed, U = Unverifiable
  if (avc.startsWith('V')) return 'Verified'
  if (avc.startsWith('P')) return 'Partially Verified'
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
