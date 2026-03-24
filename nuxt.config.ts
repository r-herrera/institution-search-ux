export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    googlePlacesApiKey: '',
    googleAddressValidationApiKey: '',
    appleMapsTeamId: '',
    appleMapsKeyId: '',
    appleMapsPrivateKey: '',
    mapboxAccessToken: '',
    amazonLocationApiKey: '',
    amazonLocationRegion: '',
    loqateApiKey: '',
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3331/api',
      mapboxAccessToken: '',
    },
  },

  app: {
    head: {
      title: 'Institution Search',
      meta: [
        { name: 'description', content: 'Search institutions worldwide by country and city' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
})
