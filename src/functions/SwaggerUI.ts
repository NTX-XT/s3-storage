import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

/**
 * Azure Function: Swagger UI
 * 
 * Serves the Swagger UI interface for testing and exploring the S3 Bucket Storage API
 * This provides an interactive web interface for the API documentation
 */
export async function SwaggerUI(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Swagger UI request for url "${request.url}"`);

    // The swagger.json endpoint URL
    const swaggerJsonUrl = "/api/swagger.json";
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Nintex S3 Bucket Storage API - Swagger UI</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
        <style>
            body {
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .header {
                background-color: #1f2937;
                color: white;
                padding: 1rem 2rem;
                border-bottom: 3px solid #3b82f6;
            }
            .header h1 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 600;
            }
            .header p {
                margin: 0.5rem 0 0 0;
                color: #d1d5db;
                font-size: 0.9rem;
            }
            #swagger-ui {
                max-width: none;
            }
            .swagger-ui .topbar {
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="header">            <h1>Nintex S3 Bucket Storage API</h1>
            <p>Azure Functions Implementation - File storage operations using S3</p>
        </div>
        <div id="swagger-ui"></div>
        
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
        <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '${swaggerJsonUrl}',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                docExpansion: 'list',
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                onComplete: function() {
                    console.log('Swagger UI loaded successfully');
                },
                requestInterceptor: function(request) {
                    // Add custom headers or modify requests if needed
                    console.log('API Request:', request);
                    return request;
                },
                responseInterceptor: function(response) {
                    // Handle responses if needed
                    console.log('API Response:', response);
                    return response;
                }
            });
            
            // Add some helpful information
            console.log('Nintex S3 Bucket Storage API Documentation');
            console.log('This API requires two authentication keys:');
            console.log('1. x-functions-key: Azure Functions authentication');
            console.log('2. x-bucket-name: S3 bucket name for tenant isolation');
        };
        </script>
    </body>
    </html>
    `;
    
    return {
        status: 200,
        headers: { 
            "Content-Type": "text/html",
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        },
        body: html
    };
}

// Register the function with Azure Functions runtime
app.http('SwaggerUI', {
    methods: ['GET'],
    authLevel: 'anonymous', // Allow anonymous access for API documentation
    route: 'swagger',
    handler: SwaggerUI
});
