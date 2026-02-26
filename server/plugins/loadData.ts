import { getDataStore } from '../utils/dataStore'

export default defineNitroPlugin(() => {
  console.log('[Plugin] Pre-loading institution data...')
  const store = getDataStore()
  console.log(`[Plugin] Data ready — ${store.totalCount.toLocaleString()} records in memory.`)
})
