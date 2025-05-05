import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  
  // Configuration schema for Orama integration
  configuration: {
    schema: z.object({
      endpoint: z.string().describe('Your Orama Cloud endpoint URL'),
      api_key: z.string().describe('Your Orama Cloud API key'),
    })
  },
  
  // Actions that the integration can perform
  actions: {
    // Full-text search
    search: {
      input: {
        schema: z.object({
          term: z.string().describe('The search term to query'),
          mode: z.enum(['fulltext', 'vector', 'hybrid']).optional().describe('Search mode (fulltext, vector, or hybrid)'),
          properties: z.array(z.string()).optional().describe('Properties to search in'),
          limit: z.number().optional().describe('Maximum number of results to return'),
          whereConditions: z.string().optional().describe('Filter conditions in JSON format (e.g., {"price":{"lt":100}})'),
          sortByProperty: z.string().optional().describe('Property to sort by (e.g., "price", "date")'),
          sortByOrder: z.enum(['asc', 'desc']).optional().describe('Sort order (ascending or descending)')
        })
      },
      output: {
        schema: z.object({
          hits: z.array(z.any()).describe('Search results'),
          count: z.number().describe('Total number of results'),
          elapsed: z.number().describe('Time taken for search in milliseconds')
        })
      }
    },
    
    // Vector search - using same schema as search but with specialized description
    vectorSearch: {
      input: {
        schema: z.object({
          term: z.string().describe('The search term to generate embeddings for vector search'),
          whereConditions: z.string().optional().describe('Filter conditions in JSON format (e.g., {"price":{"lt":100}})'),
          limit: z.number().optional().describe('Maximum number of results to return')
        })
      },
      output: {
        schema: z.object({
          hits: z.array(z.any()).describe('Vector search results'),
          count: z.number().describe('Total number of results'),
          elapsed: z.number().describe('Time taken for search in milliseconds')
        })
      }
    },
    
    // Search with facets
    searchWithFacets: {
      input: {
        schema: z.object({
          term: z.string().describe('The search term to query'),
          mode: z.enum(['fulltext', 'vector', 'hybrid']).optional().describe('Search mode'),
          facetsConfig: z.string().describe('Facet configuration in JSON format (e.g., {"category":{"limit":5}})'),
          whereConditions: z.string().optional().describe('Filter conditions in JSON format (e.g., {"price":{"lt":100}})'),
          limit: z.number().optional().describe('Maximum number of results to return')
        })
      },
      output: {
        schema: z.object({
          hits: z.array(z.any()).describe('Search results'),
          count: z.number().describe('Total number of results'),
          facets: z.record(z.any()).describe('Facet results'),
          elapsed: z.number().describe('Time taken for search in milliseconds')
        })
      }
    },
    
    // Multi-index search
    multiIndexSearch: {
      input: {
        schema: z.object({
          term: z.string().describe('The search term to query'),
          mode: z.enum(['fulltext', 'vector', 'hybrid']).optional().describe('Search mode'),
          mergeResults: z.boolean().optional().describe('Whether to merge results from multiple indexes'),
          additionalIndexes: z.array(
            z.object({
              endpoint: z.string().describe('Endpoint URL for additional index'),
              api_key: z.string().describe('API key for additional index')
            })
          ).optional().describe('Additional indexes to search')
        })
      },
      output: {
        schema: z.object({
          hits: z.array(z.any()).describe('Search results'),
          count: z.number().describe('Total number of results'),
          elapsed: z.number().describe('Time taken for search in milliseconds'),
          isMerged: z.boolean().optional().describe('Whether results were merged from multiple indexes')
        })
      }
    }
  }
})
