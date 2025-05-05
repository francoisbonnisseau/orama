/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Input = {
  /** The name of the index to search */
  indexName: string;
  /** The search term to query */
  term: string;
  /** Search mode */
  mode?: "fulltext" | "vector" | "hybrid";
  /** Facet configuration in JSON format (e.g., {"category":{"limit":5}}) */
  facetsConfig: string;
  /** Filter conditions in JSON format (e.g., {"price":{"lt":100}}) */
  whereConditions?: string;
  /** Maximum number of results to return */
  limit?: number;
};
