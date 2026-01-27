/**
 * @typedef {Object} WordStat
 * @property {string} datasetId
 * @property {string} practiceType
 * @property {number} groupId
 * @property {number} wordId
 * @property {number} successCount
 * @property {string} lastPracticedAt - ISO 8601
 */

/**
 * @typedef {Object} PracticeLogEntry
 * @property {string} datasetId
 * @property {string} practiceType
 * @property {number} groupId
 * @property {number} wordId
 * @property {string} practicedAt - ISO 8601
 */

/**
 * @typedef {Object} GroupSession
 * @property {string} datasetId
 * @property {string} practiceType
 * @property {number} groupId
 * @property {number} practicedCount
 * @property {number} skippedCount
 * @property {string} startedAt - ISO 8601
 * @property {string} completedAt - ISO 8601
 */

/**
 * Null implementation — documents the contract any stats repo must satisfy.
 * Swap createIdbStatsRepo / createHttpStatsRepo in practice-stats.js to change backend.
 */
export function createNullStatsRepo() {
  return {
    /** Record one successful practice for a word. */
    async recordSuccess(datasetId, practiceType, groupId, wordId) {},

    /** Get aggregate stat for a single word. Returns WordStat | null. */
    async getStat(datasetId, practiceType, groupId, wordId) {
      return null
    },

    /** Get aggregate stats for every word in a group. Returns WordStat[]. */
    async getGroupStats(datasetId, practiceType, groupId) {
      return []
    },

    /** Get aggregate stats for every word in a dataset. Returns WordStat[]. */
    async getDatasetStats(datasetId, practiceType) {
      return []
    },

    /** Get the full practice log for a single word. Returns PracticeLogEntry[]. */
    async getWordLog(datasetId, practiceType, groupId, wordId) {
      return []
    },

    /** Record a completed group session. */
    async recordGroupSession(session) {},

    /** Get all sessions for a group. Returns GroupSession[]. */
    async getGroupSessions(datasetId, practiceType, groupId) {
      return []
    },

    /** Get all sessions for a dataset. Returns GroupSession[]. */
    async getDatasetSessions(datasetId, practiceType) {
      return []
    },
  }
}
