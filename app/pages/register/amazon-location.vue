<template>
  <SchoolRegistrationForm
    v-model:search-query="searchQuery"
    v-model:form-data="formData"
    provider="Amazon Location"
    :countries="countries"
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
const countries = staticCountries

async function onSearch(query: string) {
  loading.value = true
  noResults.value = false
  errorMessage.value = ''

  try {
    const data = await $fetch<any>('/api/amazon/autocomplete', {
      query: { q: query, country: formData.value.country || undefined },
    })

    if (data?.ResultItems?.length) {
      suggestions.value = data.ResultItems.map((item: any) => ({
        label: item.Title || '',
        secondary: item.Address?.Label || '',
        value: item,
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
  const item = suggestion.value
  const placeId = item?.PlaceId

  if (!placeId) {
    // If no PlaceId, populate from the autocomplete result's Address directly
    const addr = item?.Address || {}
    formData.value.line1 = [addr.AddressNumber, addr.Street].filter(Boolean).join(' ') || ''
    formData.value.line2 = ''
    formData.value.city = addr.Locality || ''
    formData.value.state = addr.Region?.Code || addr.Region?.Name || ''
    formData.value.postalCode = addr.PostalCode || ''
    if (addr.Country?.Code2) {
      formData.value.country = addr.Country.Code2
    }
    return
  }

  loading.value = true
  try {
    const data = await $fetch<any>('/api/amazon/get-place', {
      query: { placeId },
    })

    const addr = data?.Address || {}
    formData.value.line1 = [addr.AddressNumber, addr.Street].filter(Boolean).join(' ') || ''
    formData.value.line2 = ''
    formData.value.city = addr.Locality || ''
    formData.value.state = addr.Region?.Code || addr.Region?.Name || ''
    formData.value.postalCode = addr.PostalCode || ''
    if (addr.Country?.Code2) {
      formData.value.country = addr.Country.Code2
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
  alert(`Amazon Location submission:\n${JSON.stringify(data, null, 2)}`)
}
</script>
