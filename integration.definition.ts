import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.2.0', // Incrémentation de la version
  readme: 'hub.md',
  icon: 'icon.svg',
  
  // Configuration schema for Orama integration with multiple indexes
  configuration: {
    schema: z.object({
      indexes: z.array(
        z.object({
          name: z.string().describe('A unique name for this index'),
          endpoint: z.string().describe('The Orama Cloud endpoint URL for this index'),
          api_key: z.string().describe('The Orama Cloud API key for this index')
        })
      ).min(1).describe('Configure one or more Orama indexes')
    })
  },
  
  // Actions that the integration can perform
  actions: {
    // Full-text search
    search: {
      input: {
        schema: z.object({
          indexName: z.string().describe('The name of the index to search'),
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
    
    // Vector search
    vectorSearch: {
      input: {
        schema: z.object({
          indexName: z.string().describe('The name of the index to search'),
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
          indexName: z.string().describe('The name of the index to search'),
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
    
    // List available indexes
    listIndexes: {
      input: {
        schema: z.object({})
      },
      output: {
        schema: z.object({
          indexes: z.array(z.object({
            name: z.string().describe('Index name'),
            endpoint: z.string().describe('Index endpoint')
          })).describe('List of available indexes')
        })
      }
    },
    
    // Multi-index search (search across multiple configured indexes)
    multiIndexSearch: {
      input: {
        schema: z.object({
          indexNames: z.array(z.string()).describe('Names of the indexes to search'),
          term: z.string().describe('The search term to query'),
          mode: z.enum(['fulltext', 'vector', 'hybrid']).optional().describe('Search mode'),
          mergeResults: z.boolean().optional().describe('Whether to merge results from multiple indexes'),
          whereConditions: z.string().optional().describe('Filter conditions in JSON format (e.g., {"price":{"lt":100}})')
        })
      },
      output: {
        schema: z.object({
          results: z.array(
            z.object({
              indexName: z.string().describe('Name of the index'),
              hits: z.array(z.any()).describe('Search results for this index'),
              count: z.number().describe('Number of results for this index'),
              elapsed: z.number().describe('Time taken for search in milliseconds')
            })
          ).describe('Search results from all indexes'),
          mergedHits: z.array(z.any()).optional().describe('Merged search results if mergeResults is true'),
          totalCount: z.number().describe('Total number of results across all indexes')
        })
      }
    }
  }
})
