<script setup lang="ts">
import type { Institution, QueryMetrics } from '~/types/search'

interface Props {
  results: Institution[]
  metrics: QueryMetrics | null
  detailedMetrics: QueryMetrics | null
  rankingExplanation: string
  rankingTechnicalDetail: string
  totalResults: number
  currentPage: number
  totalPages: number
  perPage: number
  isSearching: boolean
  hasSearched: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()

const metricsExpanded = ref(false)

function formatWebsite(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function getWebsiteHref(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`
}

const showingFrom = computed(() => {
  if (props.totalResults === 0) return 0
  return (props.currentPage - 1) * props.perPage + 1
})

const showingTo = computed(() => {
  return Math.min(props.currentPage * props.perPage, props.totalResults)
})

/**
 * Build page numbers with ellipsis for large page counts
 */
const pageNumbers = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | string)[] = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

function handlePageClick(page: number | string) {
  if (typeof page === 'number') {
    emit('page-change', page)
  }
}
</script>

<template>
  <div class="results-panel">
    <!-- Sticky metrics bar -->
    <div v-if="metrics && hasSearched" class="metrics-bar">
      <div class="metrics-left">
        <span class="result-count">
          <strong>{{ totalResults.toLocaleString() }}</strong> results
          <span v-if="totalResults > 0" class="showing-range">
            (showing {{ showingFrom }}&ndash;{{ showingTo }})
          </span>
        </span>
      </div>
      <div class="metrics-right">
        <span class="metric-chip">
          {{ metrics.duration_ms.toFixed(1) }}ms
        </span>
        <button class="metric-chip metric-toggle" @click="metricsExpanded = !metricsExpanded">
          {{ metricsExpanded ? 'Hide Details' : 'Show Details' }}
        </button>
      </div>
    </div>

    <!-- Collapsible Detailed Metrics Panel -->
    <Transition name="slide">
      <div v-if="metricsExpanded && detailedMetrics" class="metrics-detail">
        <!-- Technical ranking detail -->
        <div v-if="rankingTechnicalDetail" class="technical-detail">
          <span class="technical-label">Search Strategy</span>
          <span class="technical-text">{{ rankingTechnicalDetail }}</span>
        </div>
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-label">Query Source</span>
            <span class="metric-value">{{ detailedMetrics.query_source }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Search Method</span>
            <span class="metric-value">{{ detailedMetrics.query_type || 'N/A' }}</span>
          </div>
          <div v-if="detailedMetrics.explain" class="metric-card">
            <span class="metric-label">Scan Type</span>
            <span class="metric-value">{{ detailedMetrics.explain.scan_type || detailedMetrics.explain.node_type }}</span>
          </div>
          <div v-if="detailedMetrics.explain?.index_used" class="metric-card">
            <span class="metric-label">Index Used</span>
            <span class="metric-value index-name">{{ detailedMetrics.explain.index_used }}</span>
          </div>
          <div v-if="detailedMetrics.explain" class="metric-card">
            <span class="metric-label">Planning Time</span>
            <span class="metric-value">{{ detailedMetrics.explain.planning_time_ms.toFixed(2) }}ms</span>
          </div>
          <div v-if="detailedMetrics.explain" class="metric-card">
            <span class="metric-label">Execution Time</span>
            <span class="metric-value">{{ detailedMetrics.explain.execution_time_ms.toFixed(2) }}ms</span>
          </div>
          <div v-if="detailedMetrics.connection" class="metric-card">
            <span class="metric-label">Region</span>
            <span class="metric-value">{{ detailedMetrics.connection.region }}</span>
          </div>
          <div v-if="detailedMetrics.connection" class="metric-card">
            <span class="metric-label">Table</span>
            <span class="metric-value index-name">{{ detailedMetrics.connection.table_used }}</span>
          </div>
          <div v-if="detailedMetrics.explain?.buffers" class="metric-card">
            <span class="metric-label">Buffer Hits</span>
            <span class="metric-value">{{ detailedMetrics.explain.buffers.shared_hit ?? 0 }}</span>
          </div>
          <div v-if="detailedMetrics.explain?.buffers" class="metric-card">
            <span class="metric-label">Buffer Reads</span>
            <span class="metric-value">{{ detailedMetrics.explain.buffers.shared_read ?? 0 }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Ranking Explanation -->
    <div v-if="rankingExplanation && hasSearched && results.length > 0" class="ranking-explanation">
      <span>{{ rankingExplanation }}</span>
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
      <div class="empty-illustration" />
      <h3>No results found</h3>
      <p>No institutions matched your search criteria. Try a different term or adjust the ranking method.</p>
    </div>

    <!-- Results (scrollable container) -->
    <div v-else-if="results.length > 0" class="results-scroll-container">
      <TransitionGroup name="list" tag="ul" class="results-list">
        <li v-for="(institution, index) in results" :key="institution.id" class="result-card" :style="{ animationDelay: `${index * 30}ms` }">
          <div class="card-header">
          <h3 class="inst-name">{{ institution.organisation_name }}</h3>
          <span v-if="institution.relevance != null" class="relevance-badge">
            {{ (institution.relevance * 100).toFixed(0) }}%
          </span>
        </div>

        <div class="card-body">
          <div class="inst-location">
            <span>
              {{ institution.city
              }}{{ institution.city && institution.country ? ', ' : ''
              }}{{ institution.country }}
            </span>
          </div>

          <div v-if="institution.street_1" class="inst-address">
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
            {{ formatWebsite(institution.website) }}
          </a>
        </div>
      </li>
    </TransitionGroup>
    </div>

    <!-- Initial state -->
    <div v-else class="initial-state">
      <div class="initial-illustration" />
      <h3>Search Institutions Worldwide</h3>
      <p>Enter an institution name and click Search to find results across all regions.</p>
    </div>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1 && !isSearching" class="pagination">
      <div class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </div>
      <div class="pagination-controls">
        <button
          class="page-btn nav-btn"
          :disabled="currentPage <= 1"
          @click="handlePageClick(currentPage - 1)"
        >
          Prev
        </button>

        <template v-for="(page, i) in pageNumbers" :key="i">
          <span v-if="page === '...'" class="page-ellipsis">&hellip;</span>
          <button
            v-else
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="handlePageClick(page)"
          >
            {{ page }}
          </button>
        </template>

        <button
          class="page-btn nav-btn"
          :disabled="currentPage >= totalPages"
          @click="handlePageClick(currentPage + 1)"
        >
          Next
        </button>
      </div>
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
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 140px);
  overflow: hidden;
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

.showing-range {
  color: #9ca3af;
  font-size: 0.8rem;
}

.metrics-right {
  display: flex;
  gap: 8px;
  align-items: center;
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
  border: none;
  cursor: default;
}

.metric-toggle {
  cursor: pointer;
  background: #dbeafe;
  color: #2563eb;
  transition: background 0.15s;
  font-family: inherit;
}

.metric-toggle:hover {
  background: #bfdbfe;
}

.toggle-arrow {
  transition: transform 0.2s ease;
}

.toggle-arrow.rotated {
  transform: rotate(180deg);
}

/* Collapsible Metrics Detail Panel */
.metrics-detail {
  background: #f9fafb;
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 24px;
}

.technical-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.technical-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}

.technical-text {
  font-size: 0.8rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #4b5563;
  line-height: 1.5;
  word-break: break-word;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.metric-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}

.metric-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
}

.metric-value.index-name {
  font-size: 0.75rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  word-break: break-all;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* Ranking Explanation */
.ranking-explanation {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 24px;
  background: #dbeafe;
  border-bottom: 1px solid #93c5fd;
  font-size: 0.8rem;
  color: #1e40af;
  line-height: 1.5;
}

.ranking-explanation svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #2563eb;
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

/* Results list - scrollable */
.results-scroll-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

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

.relevance-badge {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 700;
  color: #2563eb;
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 12px;
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
  color: #2563eb;
  text-decoration: none;
  margin-top: 2px;
  transition: color 0.15s;
}

.inst-website:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.inst-website svg {
  flex-shrink: 0;
}

/* Pagination */
.pagination {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 0 0 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.pagination-info {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.page-btn:hover:not(:disabled):not(.active) {
  border-color: #93c5fd;
  color: #2563eb;
}

.page-btn.active {
  background: #2563eb;
  color: #fff;
  border-color: transparent;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn {
  padding: 0 12px;
}

.page-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #9ca3af;
  font-size: 0.85rem;
}
</style>
