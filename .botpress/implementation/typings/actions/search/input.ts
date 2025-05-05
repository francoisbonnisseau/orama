/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Input = {
  /** The name of the index to search */
  indexName: string;
  /** The search term to query */
  term: string;
  /** Search mode (fulltext, vector, or hybrid) */
  mode?: "fulltext" | "vector" | "hybrid";
  /** Properties to search in */
  properties?: string[];
  /** Maximum number of results to return */
  limit?: number;
  /** Filter conditions in JSON format (e.g., {"price":{"lt":100}}) */
  whereConditions?: string;
  /** Property to sort by (e.g., "price", "date") */
  sortByProperty?: string;
  /** Sort order (ascending or descending) */
  sortByOrder?: "asc" | "desc";
};
