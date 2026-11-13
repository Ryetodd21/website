/**
 * Centralized client-side numeric constants — page sizes, debounce windows,
 * polling intervals, SSE buffer caps. These are NOT business thresholds;
 * they're UI plumbing that previously lived as inline literals in 5+ files.
 *
 * Adding a constant here is cheap; grepping for a magic number across the
 * codebase each time someone bumps a buffer cap is not.
 */

// ─── Pagination (page size sent to /api/students etc.) ───────────────────────
/** Default page size for the students paginated table. */
export const STUDENTS_PAGE_SIZE = 50;
/** Page size for monitoring's "all monitorable students" snapshot. */
export const MONITORING_STUDENT_LIMIT = 100;
/** Page size for logs page's initial history fetch + autocomplete list. */
export const LOG_STUDENT_LIMIT = 200;
/** Autocomplete result cap in the global header search. */
export const SEARCH_AUTOCOMPLETE_LIMIT = 6;
/** Cluster-points scatter chart sample cap (Recharts perf budget). */
export const CLUSTER_POINTS_LIMIT = 500;

// ─── Search debounce (keystroke → fetch delay) ──────────────────────────────
/** Debounce for the global header search. */
export const SEARCH_DEBOUNCE_MS = 220;
/** Debounce for the students page filter input. Matches SEARCH_DEBOUNCE_MS. */
export const STUDENT_SEARCH_DEBOUNCE_MS = 220;

// ─── Polling / SSE / intervals ──────────────────────────────────────────────
/** Training-poll interval while waiting for /api/models/history to flip. */
export const MODEL_TRAINING_POLL_MS = 2000;
/** Final "training complete" pause before closing the progress dialog. */
export const MODEL_TRAINING_COMPLETE_DELAY_MS = 2000;
/** How long to keep an SSE-driven row in the "new" highlight state. */
export const NEW_LOG_HIGHLIGHT_MS = 3000;
/** SSE buffer cap for the log table (max rows kept in memory). */
export const LOGS_BUFFER_SIZE = 200;
/** Log history fetch on mount — newest N rows from server. */
export const LOG_HISTORY_FETCH_SIZE = 100;

// ─── Status indicator refresh (see components/dashboard/status-indicator) ──
/** Default probe interval for system-status pills (10s). */
export const STATUS_REFRESH_INTERVAL_MS = 10000;
/** MQTT / Redis ping cadence inside the status indicator. */
export const STATUS_PING_INTERVAL_MS = 30000;