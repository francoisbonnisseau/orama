/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Input = {
  /** Names of the indexes to search */
  indexNames: string[];
  /** The search term to query */
  term: string;
  /** Search mode */
  mode?: "fulltext" | "vector" | "hybrid";
  /** Whether to merge results from multiple indexes */
  mergeResults?: boolean;
  /** Filter conditions in JSON format (e.g., {"price":{"lt":100}}) */
  whereConditions?: string;
};
