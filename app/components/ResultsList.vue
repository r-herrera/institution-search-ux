<script setup lang="ts">
interface Institution {
  id: number
  organisation_name: string
  city: string | null
  country: string | null
  street_1?: string | null
  street_2?: string | null
  website?: string | null
}

interface QueryMetrics {
  duration_ms: number
  result_count: number
  query_source: string
  scan_type?: string
  index_used?: string
}

interface Props {
  results: Institution[]
  metrics: QueryMetrics | null
  totalMatches: number
  isSearching: boolean
  hasSearched: boolean
}

defineProps<Props>()

function formatWebsite(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function getWebsiteHref(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`
}


</script>

<template>
  <div class="results-panel">
    <!-- Sticky metrics bar -->
    <div v-if="metrics" class="metrics-bar">
      <div class="metrics-left">
        <span class="result-count">
          <strong>{{ metrics.result_count }}</strong>
          <span v-if="totalMatches > metrics.result_count"> of {{ totalMatches.toLocaleString() }}</span>
          results
        </span>
      </div>
      <div class="metrics-right">
        <span class="metric-chip">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ metrics.duration_ms.toFixed(1) }}ms
        </span>
      </div>
    </div>

    <!-- Loading skeletons -->
    <div v-if="isSearching" class="skeleton-list">
      <div v-for="i in 5" :key="i" class="skeleton-card">
        <div class="skeleton-line skeleton-title" />
        <div class="skeleton-line skeleton-subtitle" />
        <div class="skeleton-line skeleton-detail" />
      </div>
    </div>

    <!-- Empty state after search -->
    <div v-else-if="results.length === 0 && hasSearched" class="empty-state">
      <div class="empty-illustration">
        <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd" stroke-width="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" stroke-linecap="round" />
          <path d="M8 11h6" stroke-linecap="round" />
        </svg>
      </div>
      <h3>No results found</h3>
      <p>No institutions matched your search criteria. Try selecting a different city or searching all cities.</p>
    </div>

    <!-- Results -->
    <TransitionGroup v-else-if="results.length > 0" name="list" tag="ul" class="results-list">
      <li v-for="(institution, index) in results" :key="institution.id" class="result-card" :style="{ animationDelay: `${index * 30}ms` }">
        <div class="card-header">
          <h3 class="inst-name">{{ institution.organisation_name }}</h3>
        </div>

        <div class="card-body">
          <div class="inst-location">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>
              {{ institution.city
              }}{{ institution.city && institution.country ? ', ' : ''
              }}{{ institution.country }}
            </span>
          </div>

          <div v-if="institution.street_1" class="inst-address">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span>
              {{ institution.street_1 }}
              <template v-if="institution.street_2">, {{ institution.street_2 }}</template>
            </span>
          </div>

          <a
            v-if="institution.website"
            :href="getWebsiteHref(institution.website)"
            target="_blank"
            rel="noopener noreferrer"
            class="inst-website"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {{ formatWebsite(institution.website) }}
          </a>
        </div>
      </li>
    </TransitionGroup>

    <!-- Initial state -->
    <div v-else class="initial-state">
      <div class="initial-illustration">
        <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <h3>Search Institutions Worldwide</h3>
      <p>Select a country and optionally a city, then click Search to find institutions.</p>
    </div>
  </div>
</template>

<style scoped>
.results-panel {
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
  padding: 0;
  width: 100%;
  max-width: 640px;
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

/* Metrics bar - sticky */
.metrics-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 2;
  border-radius: 16px 16px 0 0;
}

.metrics-left {
  font-size: 0.875rem;
  color: #4b5563;
}

.result-count strong {
  color: #1f2937;
  font-weight: 700;
}

.metrics-right {
  display: flex;
  gap: 8px;
}

.metric-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #6b7280;
}

.metric-chip.source {
  background: #ede9fe;
  color: #7c3aed;
}

/* Skeleton loading */
.skeleton-list {
  padding: 20px 24px;
}

.skeleton-card {
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

.skeleton-card:last-child {
  border-bottom: none;
}

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-title {
  width: 60%;
  height: 18px;
  margin-bottom: 10px;
}

.skeleton-subtitle {
  width: 40%;
  margin-bottom: 8px;
}

.skeleton-detail {
  width: 50%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty & Initial states */
.empty-state,
.initial-state {
  text-align: center;
  padding: 48px 32px;
  color: #6b7280;
}

.empty-illustration,
.initial-illustration {
  margin-bottom: 16px;
  opacity: 0.7;
}

.empty-state h3,
.initial-state h3 {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.empty-state p,
.initial-state p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 300px;
  margin-inline: auto;
}

/* Results list */
.results-list {
  list-style: none;
  padding: 8px 24px;
  margin: 0;
}

/* Transition group */
.list-enter-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

/* Result cards */
.result-card {
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
  animation: fadeSlideIn 0.3s ease both;
}

.result-card:last-child {
  border-bottom: none;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.inst-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inst-location,
.inst-address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #6b7280;
}

.inst-location svg,
.inst-address svg {
  flex-shrink: 0;
  color: #9ca3af;
}

.inst-website {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #7c3aed;
  text-decoration: none;
  margin-top: 2px;
  transition: color 0.15s;
}

.inst-website:hover {
  color: #6d28d9;
  text-decoration: underline;
}

.inst-website svg {
  flex-shrink: 0;
}
</style>
