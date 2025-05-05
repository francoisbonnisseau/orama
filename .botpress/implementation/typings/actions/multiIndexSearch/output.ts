/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Output = {
  /** Search results from all indexes */
  results: Array<{
    /** Name of the index */
    indexName: string;
    /** Search results for this index */
    hits: any[];
    /** Number of results for this index */
    count: number;
    /** Time taken for search in milliseconds */
    elapsed: number;
  }>;
  /** Merged search results if mergeResults is true */
  mergedHits?: any[];
  /** Total number of results across all indexes */
  totalCount: number;
};
