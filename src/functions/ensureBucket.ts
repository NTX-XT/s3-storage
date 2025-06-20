import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createS3Service } from '../shared/s3Service';

/**
 * Azure Function: Ensure Bucket
 * Operation ID: ensure_bucket
 * 
 * Ensures that an S3 bucket exists, creating it if necessary, and configures CORS
 * Returns bucket information including region, creation date, and configuration
 * Authentication: Uses Azure Functions key-based authentication
 */
export async function ensureBucket(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing ensure bucket request');

  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,        headers: {
          'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name',
        },
      };
    }    // Extract bucket name from header (required)
    const bucketName = request.headers.get('x-bucket-name') || request.headers.get('X-Bucket-Name');
    
    // Get region from environment configuration (required)
    const bucketRegion = process.env.AWS_REGION;

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

    if (!bucketRegion) {
      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        },
        body: JSON.stringify({
          error: 'AWS_REGION environment variable is not configured.',
        }),
      };
    }

    context.log(`Ensuring bucket: ${bucketName} in region: ${bucketRegion}`);

    // Initialize S3 service with the provided bucket name
    const s3Service = createS3Service(bucketName);

    // Ensure bucket exists (create if necessary)
    const bucketInfo = await s3Service.ensureBucket(bucketRegion);

    context.log(`Bucket ensured successfully: ${bucketName}`);

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',        'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name',
      },
      body: JSON.stringify(bucketInfo),
    };

  } catch (error: any) {
    context.log('Error in ensure bucket operation:', error.message);
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name',
      },
      body: JSON.stringify({
        error: error.message,
        operation: 'ensure_bucket',
      }),
    };
  }
}

// Register the function with Azure Functions runtime
app.http('ensureBucket', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'function', // Requires Azure Functions key for authentication
  route: 'ensure-bucket',
  handler: ensureBucket,
});
