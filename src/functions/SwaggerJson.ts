import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as fs from 'fs';
import * as path from 'path';

/**
 * Azure Function: Swagger JSON
 * 
 * Serves the OpenAPI/Swagger specification for the S3 Bucket Storage API
 * This endpoint provides the API documentation in JSON format
 */
export async function SwaggerJson(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Swagger JSON request for url "${request.url}"`);

    try {
        // Read the swagger.json file
        const swaggerPath = path.join(process.cwd(), 'swagger.json');
        
        try {
            const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
            const swaggerSpec = JSON.parse(swaggerContent);
            
            // Update the host to match the current request
            const hostHeader = request.headers.get('host');
            if (hostHeader) {
                swaggerSpec.host = hostHeader;
            }
            
            // Update schemes to only allow HTTPS for security
            const protocol = request.headers.get('x-forwarded-proto') || 
                           (request.url.startsWith('https') ? 'https' : 'http');
            
            // Force HTTPS only for security in production
            swaggerSpec.schemes = protocol === 'https' ? ['https'] : ['http', 'https'];
            
            return {
                status: 200,
                body: JSON.stringify(swaggerSpec, null, 2),
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-functions-key, x-bucket-name',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            };
            
        } catch (fileError) {
            context.log(`Error reading swagger.json: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
            return {
                status: 404,
                body: JSON.stringify({ 
                    error: "Swagger specification not found. Please ensure swagger.json exists in the root directory." 
                }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

    } catch (error) {
        context.log(`Error serving Swagger JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
            status: 500,
            body: JSON.stringify({ 
                error: "Internal server error occurred while serving Swagger specification" 
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
}

// Register the function with Azure Functions runtime
app.http('SwaggerJson', {
    methods: ['GET'],
    authLevel: 'anonymous', // Allow anonymous access for API documentation
    route: 'swagger.json',
    handler: SwaggerJson
});
