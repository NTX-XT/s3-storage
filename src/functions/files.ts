import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createS3Service } from '../shared/s3Service';

/**
 * Azure Function: List Files
 * Operation ID: files
 * 
 * Lists all files in the S3 bucket with optional prefix filtering
 * Authentication: Uses Azure Functions key-based authentication
 * Bucket: Uses deployment-configured bucket, optionally overridable via x-bucket-name header
 */
export async function files(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing files list request');

  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,        headers: {
          'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name, x-file-path',
        },
      };
    }    // Extract parameters from headers
    const prefix = request.headers.get('x-file-path') || request.headers.get('X-File-Path') || '';
    const bucketName = request.headers.get('x-bucket-name') || request.headers.get('X-Bucket-Name');

    if (!bucketName) {
      return {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        },
        body: JSON.stringify({
          error: 'Bucket name is required. Please provide x-bucket-name header.',
        }),
      };
    }

    context.log(`Listing files with prefix: "${prefix}", bucket: ${bucketName}`);

    // Initialize S3 service with the provided bucket name
    const s3Service = createS3Service(bucketName);

    // List objects from S3
    const files = await s3Service.listObjects(prefix || undefined);

    context.log(`Found ${files.length} files`);

    return {
      status: 200,      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name, x-file-path',
      },
      body: JSON.stringify(files),
    };

  } catch (error: any) {
    context.log('Error in files operation:', error.message);
    return {
      status: 500,      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name, x-file-path',
      },
      body: JSON.stringify({
        error: error.message,
        operation: 'files',
      }),
    };
  }
}

// Register the function with Azure Functions runtime
app.http('files', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'function', // Requires Azure Functions key for authentication
  route: 'files',
  handler: files,
});
