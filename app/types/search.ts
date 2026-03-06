export interface Institution {
  id: number
  organisation_name: string
  city: string | null
  country: string | null
  region?: string | null
  street_1?: string | null
  street_2?: string | null
  website?: string | null
  relevance?: number
}

export interface ExplainOutput {
  planning_time_ms: number
  execution_time_ms: number
  total_cost: number
  startup_cost: number
  plan_rows: number
  actual_rows?: number
  node_type: string
  fdw_scans: any[]
  buffers?: {
    shared_hit?: number
    shared_read?: number
    shared_written?: number
    local_hit?: number
    local_read?: number
    local_written?: number
    temp_read?: number
    temp_written?: number
  }
  index_used?: string
  scan_type?: 'seq' | 'index' | 'bitmap' | 'foreign'
}

export interface QueryMetrics {
  duration_ms: number
  rows_returned: number
  query_source: string
  executed_at: string
  explain?: ExplainOutput
  connection?: {
    is_master: boolean
    region: string
    table_used: string
  }
  query_type?: string
  search_term?: string
}

export interface PaginatedSearchResponse {
  data: Institution[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
    first_page: number
    next_page_url: string | null
    previous_page_url: string | null
  }
  metrics: QueryMetrics
  ranking_explanation: string
  ranking_technical_detail: string
}

export interface LocationResponse {
  results: string[]
  metrics: QueryMetrics
}

export type RankingMethod = 'websearch' | 'trgm'
