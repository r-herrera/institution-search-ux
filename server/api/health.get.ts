export default defineEventHandler(() => {
  const store = getDataStore()

  return {
    status: 'ok',
    total_institutions: store.totalCount,
    total_countries: store.countries.length,
    data_source: 'static_json',
  }
})
