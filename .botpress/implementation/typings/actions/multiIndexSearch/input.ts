/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Input = {
  /** The search term to query */
  term: string;
  /** Search mode */
  mode?: "fulltext" | "vector" | "hybrid";
  /** Whether to merge results from multiple indexes */
  mergeResults?: boolean;
  /** Additional indexes to search */
  additionalIndexes?: Array<{
    /** Endpoint URL for additional index */
    endpoint: string;
    /** API key for additional index */
    api_key: string;
  }>;
};
