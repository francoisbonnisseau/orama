import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { OramaClient } from '@oramacloud/client'

/**
 * Creates an instance of the Orama client with the provided configuration
 */
function createOramaClient(configuration: { endpoint: string; api_key: string }) {
  return new OramaClient({
    endpoint: configuration.endpoint,
    api_key: configuration.api_key,
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
      // Create an Orama client with the provided configuration
      const client = createOramaClient(ctx.configuration)
      
      // Simply validate configuration without actual search
      logger.forBot().info('Orama integration registered successfully')
    } catch (error) {
      logger.forBot().error('Failed to register Orama integration', error)
      throw new sdk.RuntimeError('Invalid configuration: Failed to connect to Orama API')
    }
  },
  
  unregister: async ({ logger }) => {
    // No specific cleanup needed for Orama API
    logger.forBot().info('Orama integration unregistered')
  },
  
  actions: {
    // General search action supporting full-text, vector, and hybrid search
    search: async ({ ctx, input, logger }) => {
      const client = createOramaClient(ctx.configuration)
      
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
        //logger.forBot().debug('Orama search params:', JSON.stringify(searchParams))
        
        const results = await client.search(searchParams)
        
        return {
          hits: results.hits || [],
          count: results.count || 0,
          elapsed: Number(results.elapsed) || 0
        }
      } catch (error:any) {
        // More detailed error logging to troubleshoot the issue
        let errorMessage = `Error performing search: ${error.message || 'Unknown error'}`
        
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
      const client = createOramaClient(ctx.configuration)
      
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
        logger.forBot().debug('Orama vector search params:', JSON.stringify(searchParams))
        
        const results = await client.search(searchParams)
        
        return {
          hits: results.hits || [],
          count: results.count || 0,
          elapsed: Number(results.elapsed) || 0
        }
      } catch (error:any) {
        // More detailed error logging to troubleshoot the issue
        let errorMessage = `Error performing vector search: ${error.message || 'Unknown error'}`
        
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
      const client = createOramaClient(ctx.configuration)
      
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
        logger.forBot().debug('Orama facets search params:', JSON.stringify(searchParams))
        
        const results = await client.search(searchParams)
        
        return {
          hits: results.hits || [],
          count: results.count || 0,
          facets: results.facets || {},
          elapsed: Number(results.elapsed) || 0
        }
      } catch (error:any) {
        // More detailed error logging to troubleshoot the issue
        let errorMessage = `Error performing search with facets: ${error.message || 'Unknown error'}`
        
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
        // Create client options for multi-index search
        const clientOptions: any = {
          mergeResults: input.mergeResults === true,  // Ensure boolean
        }
        
        // Only add indexes if additionalIndexes exists and has items
        if (input.additionalIndexes && Array.isArray(input.additionalIndexes) && input.additionalIndexes.length > 0) {
          clientOptions.indexes = [
            { endpoint: ctx.configuration.endpoint, api_key: ctx.configuration.api_key },
            ...input.additionalIndexes
          ]
        }
        
        // Debug log the client options
        logger.forBot().debug('Orama multi-index client options:', JSON.stringify({
          ...clientOptions,
          indexes: clientOptions.indexes ? `${clientOptions.indexes.length} indexes` : 'no indexes'
        }))
        
        const client = new OramaClient(clientOptions)
        
        const searchParams: any = {
          term: input.term || '',
        }
        
        // Only add mode if defined
        if (input.mode) searchParams.mode = input.mode
        
        // Debug log the search parameters
        logger.forBot().debug('Orama multi-index search params:', JSON.stringify(searchParams))
        
        const results = await client.search(searchParams)
        
        // Format the response according to our updated schema
        return {
          hits: Array.isArray(results) ? results[0]?.hits || [] : results.hits || [],
          count: Array.isArray(results) ? results[0]?.count || 0 : results.count || 0,
          elapsed: Array.isArray(results) ? Number(results[0]?.elapsed) || 0 : Number(results.elapsed) || 0,
          isMerged: input.mergeResults === true
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
