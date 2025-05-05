import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { OramaClient } from '@oramacloud/client'

/**
 * Interface representing an Orama index configuration
 */
interface OramaIndexConfig {
  name: string
  endpoint: string
  api_key: string
}

/**
 * Gets an index configuration by its name
 */
function getIndexByName(configuration: { indexes: OramaIndexConfig[] }, indexName: string): OramaIndexConfig | undefined {
  return configuration.indexes.find(index => index.name === indexName)
}

/**
 * Creates an instance of the Orama client for a specific index
 */
function createOramaClientForIndex(indexConfig: OramaIndexConfig) {
  return new OramaClient({
    endpoint: indexConfig.endpoint,
    api_key: indexConfig.api_key,
  })
}

/**
 * Safely parses a JSON string and returns the parsed object or null if invalid
 */
function safeJsonParse(jsonString: string | undefined, logger: any): any | null {
  if (!jsonString) return null
  
  try {
    return JSON.parse(jsonString)
  } catch (error:any) {
    logger.forBot().warn(`Failed to parse JSON: ${error.message}`, { jsonString })
    return null
  }
}

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    try {
      // Validate that at least one index is configured
      if (!ctx.configuration.indexes || ctx.configuration.indexes.length === 0) {
        throw new Error('No indexes configured')
      }
      
      // Validate that each index has a name, endpoint, and API key
      for (const index of ctx.configuration.indexes) {
        if (!index.name || !index.endpoint || !index.api_key) {
          throw new Error(`Index ${index.name || 'unnamed'} is missing required fields`)
        }
      }
      
      // Validate that index names are unique
      const indexNames = ctx.configuration.indexes.map(index => index.name)
      if (new Set(indexNames).size !== indexNames.length) {
        throw new Error('Index names must be unique')
      }
      
      logger.forBot().info(`Orama integration registered successfully with ${ctx.configuration.indexes.length} indexes`)
    } catch (error:any) {
      logger.forBot().error('Failed to register Orama integration', error)
      throw new sdk.RuntimeError(`Invalid configuration: ${error.message}`)
    }
  },
  
  unregister: async ({ logger }) => {
    // No specific cleanup needed for Orama API
    logger.forBot().info('Orama integration unregistered')
  },
  
  actions: {
    // List all configured indexes
    listIndexes: async ({ ctx }) => {
      return {
        indexes: ctx.configuration.indexes.map(index => ({
          name: index.name,
          endpoint: index.endpoint
        }))
      }
    },
    
    // General search action supporting full-text, vector, and hybrid search
    search: async ({ ctx, input, logger }) => {
      // Get the specified index configuration
      const indexConfig = getIndexByName(ctx.configuration, input.indexName)
      if (!indexConfig) {
        throw new sdk.RuntimeError(`Index '${input.indexName}' not found`)
      }
      
      // Create client for the specified index
      const client = createOramaClientForIndex(indexConfig)
      
      try {
        // Create a clean search params object with only the necessary fields
        const searchParams: any = {
          term: input.term || '', // Ensure there's always a term (could be empty string)
        }
        
        // Only add optional parameters if they are defined
        if (input.mode) searchParams.mode = input.mode
        if (input.properties && Array.isArray(input.properties) && input.properties.length > 0) {
          searchParams.properties = input.properties
        }
        if (typeof input.limit === 'number') searchParams.limit = input.limit
        
        // Parse whereConditions from JSON string if provided
        const whereObject = safeJsonParse(input.whereConditions, logger)
        if (whereObject) {
          searchParams.where = whereObject
        }
        
        // Handle the simplified sortBy structure
        if (input.sortByProperty && input.sortByProperty.trim() !== '') {
          searchParams.sortBy = {
            property: input.sortByProperty,
            order: input.sortByOrder || 'asc'
          }
        }
        
        // Debug log the search parameters
        logger.forBot().debug(`Orama search params for index '${input.indexName}':`, JSON.stringify(searchParams))
        
        const results = await client.search(searchParams)
        
        return {
          hits: results.hits || [],
          count: results.count || 0,
          elapsed: Number(results.elapsed) || 0
        }
      } catch (error:any) {
        // More detailed error logging to troubleshoot the issue
        let errorMessage = `Error performing search on index '${input.indexName}': ${error.message || 'Unknown error'}`
        
        // If there's an HTTP response in the error, try to get more information
        if (error.httpResponse) {
          try {
            const responseText = await error.httpResponse.text()
            errorMessage += ` - API Response: ${responseText}`
          } catch (e) {
            // If we can't get the response text, just use the status
            errorMessage += ` - Status: ${error.httpResponse.status} ${error.httpResponse.statusText}`
          }
        }
        
        logger.forBot().error(errorMessage)
        throw new sdk.RuntimeError(errorMessage)
      }
    },
    
    // Dedicated vector search action
    vectorSearch: async ({ ctx, input, logger }) => {
      // Get the specified index configuration
      const indexConfig = getIndexByName(ctx.configuration, input.indexName)
      if (!indexConfig) {
        throw new sdk.RuntimeError(`Index '${input.indexName}' not found`)
      }
      
      // Create client for the specified index
      const client = createOramaClientForIndex(indexConfig)
      
      try {
        const searchParams: any = {
          term: input.term || '',
          mode: 'vector', // Force vector mode
        }
        
        // Only add optional parameters if they are defined
        if (typeof input.limit === 'number') searchParams.limit = input.limit
        
        // Parse whereConditions from JSON string if provided
        const whereObject = safeJsonParse(input.whereConditions, logger)
        if (whereObject) {
          searchParams.where = whereObject
        }
        
        // Debug log the search parameters
        logger.forBot().debug(`Orama vector search params for index '${input.indexName}':`, JSON.stringify(searchParams))
        
        const results = await client.search(searchParams)
        
        return {
          hits: results.hits || [],
          count: results.count || 0,
          elapsed: Number(results.elapsed) || 0
        }
      } catch (error:any) {
        // More detailed error logging to troubleshoot the issue
        let errorMessage = `Error performing vector search on index '${input.indexName}': ${error.message || 'Unknown error'}`
        
        // If there's an HTTP response in the error, try to get more information
        if (error.httpResponse) {
          try {
            const responseText = await error.httpResponse.text()
            errorMessage += ` - API Response: ${responseText}`
          } catch (e) {
            // If we can't get the response text, just use the status
            errorMessage += ` - Status: ${error.httpResponse.status} ${error.httpResponse.statusText}`
          }
        }
        
        logger.forBot().error(errorMessage)
        throw new sdk.RuntimeError(errorMessage)
      }
    },
    
    // Search with facets
    searchWithFacets: async ({ ctx, input, logger }) => {
      // Get the specified index configuration
      const indexConfig = getIndexByName(ctx.configuration, input.indexName)
      if (!indexConfig) {
        throw new sdk.RuntimeError(`Index '${input.indexName}' not found`)
      }
      
      // Create client for the specified index
      const client = createOramaClientForIndex(indexConfig)
      
      try {
        const searchParams: any = {
          term: input.term || '',
        }
        
        // Parse facetsConfig from JSON string
        const facetsObject = safeJsonParse(input.facetsConfig, logger)
        if (facetsObject) {
          searchParams.facets = facetsObject
        } else {
          throw new sdk.RuntimeError('Invalid facets configuration format. Please provide a valid JSON object.')
        }
        
        // Only add optional parameters if they are defined
        if (input.mode) searchParams.mode = input.mode
        if (typeof input.limit === 'number') searchParams.limit = input.limit
        
        // Parse whereConditions from JSON string if provided
        const whereObject = safeJsonParse(input.whereConditions, logger)
        if (whereObject) {
          searchParams.where = whereObject
        }
        
        // Debug log the search parameters
        logger.forBot().debug(`Orama facets search params for index '${input.indexName}':`, JSON.stringify(searchParams))
        
        const results = await client.search(searchParams)
        
        return {
          hits: results.hits || [],
          count: results.count || 0,
          facets: results.facets || {},
          elapsed: Number(results.elapsed) || 0
        }
      } catch (error:any) {
        // More detailed error logging to troubleshoot the issue
        let errorMessage = `Error performing search with facets on index '${input.indexName}': ${error.message || 'Unknown error'}`
        
        // If there's an HTTP response in the error, try to get more information
        if (error.httpResponse) {
          try {
            const responseText = await error.httpResponse.text()
            errorMessage += ` - API Response: ${responseText}`
          } catch (e) {
            // If we can't get the response text, just use the status
            errorMessage += ` - Status: ${error.httpResponse.status} ${error.httpResponse.statusText}`
          }
        }
        
        logger.forBot().error(errorMessage)
        throw new sdk.RuntimeError(errorMessage)
      }
    },
    
    // Multi-index search
    multiIndexSearch: async ({ ctx, input, logger }) => {
      try {
        // Validate the specified index names and get their configurations
        const indexConfigs: OramaIndexConfig[] = []
        for (const indexName of input.indexNames) {
          const indexConfig = getIndexByName(ctx.configuration, indexName)
          if (!indexConfig) {
            throw new sdk.RuntimeError(`Index '${indexName}' not found`)
          }
          indexConfigs.push(indexConfig)
        }
        
        // Create client options for multi-index search
        const clientOptions: any = {
          mergeResults: input.mergeResults === true,  // Ensure boolean
          indexes: indexConfigs.map(config => ({
            endpoint: config.endpoint,
            api_key: config.api_key
          }))
        }
        
        // Debug log the client options
        logger.forBot().debug('Orama multi-index client options:', JSON.stringify({
          mergeResults: clientOptions.mergeResults,
          indexes: `${clientOptions.indexes.length} indexes`
        }))
        
        const client = new OramaClient(clientOptions)
        
        const searchParams: any = {
          term: input.term || '',
        }
        
        // Only add mode if defined
        if (input.mode) searchParams.mode = input.mode
        
        // Parse whereConditions from JSON string if provided
        const whereObject = safeJsonParse(input.whereConditions, logger)
        if (whereObject) {
          searchParams.where = whereObject
        }
        
        // Debug log the search parameters
        logger.forBot().debug('Orama multi-index search params:', JSON.stringify(searchParams))
        
        const results = await client.search(searchParams)
        
        // Process the results based on whether they're merged or not
        if (input.mergeResults === true) {
          // If results are merged, they will be a single object
          return {
            results: [{
              indexName: 'merged',
              hits: results.hits || [],
              count: results.count || 0,
              elapsed: Number(results.elapsed) || 0
            }],
            mergedHits: results.hits || [],
            totalCount: results.count || 0
          }
        } else {
          // If results are not merged, they will be an array of objects
          const processedResults = Array.isArray(results) ? results.map((result, index) => ({
            indexName: input.indexNames[index] || `index-${index}`,
            hits: result.hits || [],
            count: result.count || 0,
            elapsed: Number(result.elapsed) || 0
          })) : []
          
          const totalCount = processedResults.reduce((total, result) => total + result.count, 0)
          
          return {
            results: processedResults,
            totalCount
          }
        }
      } catch (error:any) {
        // More detailed error logging to troubleshoot the issue
        let errorMessage = `Error performing multi-index search: ${error.message || 'Unknown error'}`
        
        // If there's an HTTP response in the error, try to get more information
        if (error.httpResponse) {
          try {
            const responseText = await error.httpResponse.text()
            errorMessage += ` - API Response: ${responseText}`
          } catch (e) {
            // If we can't get the response text, just use the status
            errorMessage += ` - Status: ${error.httpResponse.status} ${error.httpResponse.statusText}`
          }
        }
        
        logger.forBot().error(errorMessage)
        throw new sdk.RuntimeError(errorMessage)
      }
    }
  },
  
  channels: {},
  handler: async () => {},
})
