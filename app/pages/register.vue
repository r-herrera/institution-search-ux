<template>
  <div class="register-page">
    <header class="register-header">
      <div class="register-header-inner">
        <div class="header-left">
          <NuxtLink to="/" class="back-link">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
            Back to Search
          </NuxtLink>
        </div>
        <nav class="tab-nav">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.to"
            :to="tab.to"
            class="tab-link"
            :class="{ active: $route.path === tab.to }"
          >
            {{ tab.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main class="register-main">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const tabs = [
  { label: 'Google Places', to: '/register/google' },
  { label: 'Apple Maps', to: '/register/apple' },
  { label: 'Mapbox Search JS', to: '/register/mapbox-search-js' },
  { label: 'Amazon Location', to: '/register/amazon-location' },
  { label: 'Loqate', to: '/register/loqate' },
]
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.register-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.register-header-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s;
  white-space: nowrap;
}

.back-link:hover {
  color: #2563eb;
}

.register-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.02em;
}

.tab-nav {
  display: flex;
  gap: 4px;
  overflow-x: auto;
}

.tab-link {
  display: inline-block;
  padding: 10px 18px;
  border-radius: 10px 10px 0 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.tab-link:hover:not(.active) {
  background: #f3f4f6;
  color: #374151;
}

.tab-link.active {
  background: #2563eb;
  color: #fff;
}

.register-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 32px 24px;
}

.register-main > :deep(*) {
  width: 100%;
  max-width: 560px;
}
</style>
