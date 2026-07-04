/**
 * Full intent surface for the feature (spec US1 add/update, US2 query, US3
 * cancel) is modeled up front since all three are implemented in this same
 * plan — CommandRouterService only acts on the subset each phase adds.
 */
export type PerformanceIntent =
  | 'add_or_update'
  | 'cancel'
  | 'query_next'
  | 'query_date'
  | 'query_list'
  | 'unrecognized';

export interface ExtractionResult {
  intent: PerformanceIntent;
  /** ISO yyyy-mm-dd, or null if not present/determinable. */
  date: string | null;
  /** 24h HH:mm, or null if not given. */
  time: string | null;
  location: string | null;
  notes: string | null;
  confidence: number;
}
