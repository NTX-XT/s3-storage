import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createS3Service } from '../shared/s3Service';

/**
 * Azure Function: Download File
 * Operation ID: files_download
 *  * Downloads a file from S3 bucket by returning a redirect to a presigned URL
 * Uses presigned URLs for efficient direct S3 access instead of proxying file content
 */
export async function filesDownload(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing file download request');

  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,        headers: {
          'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name, x-file-key, x-file-path',
        },
      };
    }    // Extract parameters from headers
    const fileKey = request.headers.get('x-file-key') || request.headers.get('X-File-Key');
    const bucketName = request.headers.get('x-bucket-name') || request.headers.get('X-Bucket-Name');
    
    if (!fileKey) {
      return {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        },
        body: JSON.stringify({
          error: 'File key not provided. Please specify x-file-key header.',
        }),
      };
    }

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

    context.log(`Generating download URL for file: "${fileKey}", bucket: ${bucketName}`);

    // Initialize S3 service with the provided bucket name
    const s3Service = createS3Service(bucketName);

    // Generate presigned URL for download (1 hour expiration)
    const presignedUrl = await s3Service.getPresignedUrl(fileKey, 3600);    context.log(`Presigned URL generated for file: ${fileKey}`);

    // Return a 303 redirect to the presigned URL
    // Note: This differs from the original Prismatic implementation which returned file content directly
    return {
      status: 303,
      headers: {
        'Content-Type': 'application/json',
        'Location': presignedUrl,
        'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name, x-file-key, x-file-path',
      },
      body: '',
    };

  } catch (error: any) {
    context.log('Error in files download operation:', error.message);
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name, x-file-key, x-file-path',
      },
      body: JSON.stringify({
        error: error.message,
        operation: 'files_download',
      }),
    };
  }
}

// Register the function with Azure Functions runtime
app.http('files-download', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function', // Requires Azure Functions key for authentication
  route: 'files-download',
  handler: filesDownload,
});
