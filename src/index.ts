/**
 * Azure Functions Entry Point
 * 
 * This file imports all the Azure Functions to register them with the runtime.
 * Each function is defined in its own file and registered using the app.http() method.
 */

// Import all function handlers to register them
import './functions/files';
import './functions/filesUpload';
import './functions/filesDownload';
import './functions/ensureBucket';
import './functions/SwaggerJson';
import './functions/SwaggerUI';

// Export a simple health check function
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

/**
 * Health check endpoint
 */
export async function healthCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'Nintex S3 Bucket Storage Azure Functions',
    }),
  };
}

// Register health check
app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: healthCheck,
});
