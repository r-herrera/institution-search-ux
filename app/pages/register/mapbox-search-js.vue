<template>
  <form ref="formRef" class="reg-card" @submit.prevent="onSubmit">
    <h2 class="reg-title">Mapbox Search JS — School Registration</h2>

    <p class="confirmation-badge confirmed">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
      Address Confirmation ("Did you mean?") available
    </p>

    <p class="hint-text">
      This tab uses <code>@mapbox/search-js-web</code> Web Components.
      Address autofill and "Did you mean?" confirmation are handled client-side by the Mapbox library.
    </p>

    <!-- Country -->
    <div class="field">
      <label for="mbx-country">Country</label>
      <select
        id="mbx-country"
        v-model="selectedCountry"
      >
        <option value="">Select a country (optional)</option>
        <option v-for="c in countryItems" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <!-- Address Search (dedicated search box) -->
    <div class="field">
      <label>Address Search</label>
      <div ref="searchboxContainer" class="searchbox-wrapper" />
      <p v-if="!accessToken || accessToken === 'your-mapbox-access-token'" class="field-warning">
        Configure a Mapbox access token to enable address search.
      </p>
    </div>

    <!-- Hidden country input for confirmAddress -->  
    <input type="hidden" autocomplete="country" :value="formData.country" />

    <!-- Address Line 1 -->
    <div class="field">
      <label for="mbx-line1">Address Line 1</label>
      <input
        id="mbx-line1"
        v-model="formData.line1"
        type="text"
        autocomplete="address-line1"
        placeholder="Address Line 1"
      />
    </div>

    <!-- Address Line 2 -->
    <div class="field">
      <label for="mbx-line2">Address Line 2 <span class="optional-tag">optional</span></label>
      <input
        id="mbx-line2"
        v-model="formData.line2"
        type="text"
        autocomplete="address-line2"
        placeholder="Address Line 2"
      />
    </div>

    <!-- City / Town -->
    <div class="field">
      <label for="mbx-city">City / Town</label>
      <input
        id="mbx-city"
        v-model="formData.city"
        type="text"
        autocomplete="address-level2"
        placeholder="City / Town"
      />
    </div>

    <!-- State / County / Region -->
    <div class="field">
      <label for="mbx-state">State / County / Region</label>
      <input
        id="mbx-state"
        v-model="formData.state"
        type="text"
        autocomplete="address-level1"
        placeholder="State / County / Region"
      />
    </div>

    <!-- Postal / Zip Code -->
    <div class="field">
      <label for="mbx-postal">Postal / Zip Code</label>
      <input
        id="mbx-postal"
        v-model="formData.postalCode"
        type="text"
        autocomplete="postal-code"
        placeholder="Postal / Zip Code"
      />
    </div>

    <hr class="divider" />

    <!-- School Name -->
    <div class="field">
      <label for="mbx-school-name">School Name</label>
      <input id="mbx-school-name" v-model="formData.schoolName" type="text" placeholder="School Name" />
    </div>

    <!-- School Website URL -->
    <div class="field">
      <label for="mbx-website">School Website URL</label>
      <input id="mbx-website" v-model="formData.schoolWebsite" type="url" placeholder="https://..." />
    </div>

    <!-- Telephone Number -->
    <div class="field">
      <label for="mbx-tel">Telephone Number</label>
      <input id="mbx-tel" v-model="formData.telephone" type="tel" placeholder="Telephone Number" />
    </div>

    <!-- Confirmation result -->
    <div v-if="confirmationStatus" class="confirmation-result" :class="confirmationStatus">
      <span v-if="confirmationStatus === 'nochange'">Address confirmed — no changes needed.</span>
      <span v-else-if="confirmationStatus === 'change'">Address updated with Mapbox suggestion.</span>
      <span v-else-if="confirmationStatus === 'cancel'">Confirmation cancelled — please review your address.</span>
    </div>

    <button type="submit" class="submit-btn" :disabled="confirming">
      <template v-if="confirming">Confirming...</template>
      <template v-else>Submit Registration</template>
    </button>
  </form>
</template>

<script setup lang="ts">
import { registrationCountries as staticCountries } from '~/utils/registration-countries'

const runtimeConfig = useRuntimeConfig()
const accessToken = runtimeConfig.public.mapboxAccessToken

const formRef = ref<HTMLFormElement | null>(null)
const searchboxContainer = ref<HTMLDivElement | null>(null)
const selectedCountry = ref('')
const confirming = ref(false)
const confirmationStatus = ref<'nochange' | 'change' | 'cancel' | null>(null)

const formData = ref({
  country: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  schoolName: '',
  schoolWebsite: '',
  telephone: '',
})

const countryItems = computed(() =>
  staticCountries.map(c => ({ label: c.name, value: c.code }))
)

let searchboxInstance: any = null
let searchJS: any = null

onMounted(async () => {
  if (!accessToken || accessToken === 'your-mapbox-access-token') {
    return
  }

  try {
    searchJS = await import('@mapbox/search-js-web')

    // Create standalone Search Box element
    if (searchboxContainer.value) {
      const searchbox = document.createElement('mapbox-search-box') as any
      searchbox.accessToken = accessToken
      if (selectedCountry.value) {
        searchbox.options = { country: selectedCountry.value.toLowerCase() }
      }

      searchbox.addEventListener('retrieve', (e: any) => {
        const feature = e.detail?.features?.[0]
        if (!feature) return
        const props = feature.properties || {}
        const ctx = props.context || {}

        formData.value.line1 = props.name || ''
        formData.value.line2 = ''
        formData.value.city = ctx.place?.name || ctx.locality?.name || ctx.neighborhood?.name || ''
        formData.value.state = ctx.region?.name || ''
        formData.value.postalCode = ctx.postcode?.name || ''

        const countryCode = ctx.country?.country_code?.toUpperCase()
        if (countryCode) {
          formData.value.country = countryCode
          selectedCountry.value = countryCode
        }
      })

      searchboxContainer.value.appendChild(searchbox)
      searchboxInstance = searchbox
    }
  } catch (e) {
    console.warn('Mapbox Search JS failed to initialize:', e)
  }
})

watch(selectedCountry, (code) => {
  formData.value.country = code
  if (searchboxInstance && code) {
    searchboxInstance.options = { ...searchboxInstance.options, country: code.toLowerCase() }
  }
})

async function onSubmit() {
  confirming.value = true
  confirmationStatus.value = null

  try {
    if (searchJS?.confirmAddress && formRef.value && formData.value.line1) {
      const result = await searchJS.confirmAddress(formRef.value, {
        accessToken,
      })

      confirmationStatus.value = result?.type ?? 'nochange'

      if (result?.type === 'cancel') {
        confirming.value = false
        return
      }

      // confirmAddress updates DOM inputs directly; sync values back to formData
      if (result?.type === 'change' && formRef.value) {
        const getVal = (ac: string) =>
          (formRef.value!.querySelector<HTMLInputElement>(`[autocomplete="${ac}"]`))?.value ?? ''
        formData.value.line1 = getVal('address-line1')
        formData.value.line2 = getVal('address-line2')
        formData.value.city = getVal('address-level2')
        formData.value.state = getVal('address-level1')
        formData.value.postalCode = getVal('postal-code')
      }
    }

    alert(`Mapbox Search JS submission:\n${JSON.stringify(formData.value, null, 2)}`)
  } catch (e) {
    alert(`Submission complete:\n${JSON.stringify(formData.value, null, 2)}`)
  } finally {
    confirming.value = false
  }
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
  margin: 0 0 12px;
}

.confirmation-badge.confirmed {
  color: #16a34a;
}

.hint-text {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 20px;
  line-height: 1.5;
}

.hint-text code {
  font-size: 0.78rem;
  background: #f3f4f6;
  padding: 1px 5px;
  border-radius: 4px;
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

.minimap-container {
  height: 160px;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #e5e7eb;
  margin-bottom: 18px;
}

.searchbox-wrapper {
  width: 100%;
}

.searchbox-wrapper mapbox-search-box {
  width: 100%;
}

.field-warning {
  margin: -10px 0 0;
  font-size: 0.8rem;
  color: #d97706;
}

.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 24px 0;
}

/* Confirmation result */
.confirmation-result {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.confirmation-result.nochange {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.confirmation-result.change {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.confirmation-result.cancel {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
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

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
