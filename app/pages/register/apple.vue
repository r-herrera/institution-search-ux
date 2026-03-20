<template>
  <SchoolRegistrationForm
    v-model:search-query="searchQuery"
    v-model:form-data="formData"
    provider="Apple Maps"
    :countries="appleCountries"
    :suggestions="suggestions"
    :loading="loading"
    :no-results="noResults"
    :error-message="errorMessage"
    :address-confirmation="false"
    @search="onSearch"
    @select-suggestion="onSelect"
    @country-change="onCountryChange"
    @submit="onSubmit"
  />
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
const appleCountries = staticCountries

async function onSearch(query: string) {
  loading.value = true
  noResults.value = false
  errorMessage.value = ''

  try {
    const data = await $fetch<any>('/api/apple/autocomplete', {
      query: { q: query, country: formData.value.country || undefined },
    })

    if (data?.results?.length) {
      suggestions.value = data.results.map((r: any) => ({
        label: r.displayLines?.[0] || r.completionUrl || '',
        secondary: r.displayLines?.[1] || r.location?.name || '',
        value: r,
      }))
    } else {
      suggestions.value = []
      noResults.value = true
    }
  } catch (err: any) {
    if (err?.statusCode === 429) {
      errorMessage.value = 'Rate limit reached. Please try again in a moment.'
    } else {
      errorMessage.value = err?.data?.message || 'Failed to search addresses'
    }
    suggestions.value = []
  } finally {
    loading.value = false
  }
}

async function onSelect(suggestion: Suggestion) {
  const result = suggestion.value
  const completionUrl = result?.completionUrl
  const displayText = result?.displayLines?.[0] || ''

  loading.value = true
  try {
    const data = await $fetch<any>('/api/apple/search', {
      query: { q: completionUrl || displayText, country: formData.value.country || undefined },
    })

    if (data?.results?.length) {
      const place = data.results[0]
      const addr = place.structuredAddress || {}

      formData.value.line1 = [addr.subThoroughfare, addr.thoroughfare].filter(Boolean).join(' ')
        || addr.fullThoroughfare || ''
      formData.value.line2 = ''
      formData.value.city = addr.locality || addr.subLocality || ''
      formData.value.state = addr.administrativeArea || ''
      formData.value.postalCode = addr.postCode || ''
      if (addr.countryCode) {
        formData.value.country = addr.countryCode.toUpperCase()
      }
    }
  } catch (err: any) {
    errorMessage.value = 'Failed to retrieve address details'
  } finally {
    loading.value = false
  }
}

function onCountryChange() {
  suggestions.value = []
  noResults.value = false
  errorMessage.value = ''
}

function onSubmit(data: FormData) {
  alert(`Apple Maps submission:\n${JSON.stringify(data, null, 2)}`)
}
</script>
