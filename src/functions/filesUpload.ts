import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createS3Service } from '../shared/s3Service';
import { parseMultipartFormData, isMultipartFormData, getMimeTypeFromExtension } from '../shared/formParser';

/**
 * Azure Function: Upload File
 * Operation ID: files_upload
 * 
 * Uploads a file to S3 bucket
 * Matches the Prismatic integration's "files-upload" flow
 */
export async function filesUpload(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing file upload request');

  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name, x-file-key, x-file',
        },
      };    }    // Extract parameters from headers
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

    context.log(`Uploading file with key: "${fileKey}", bucket: ${bucketName}`);

    // Check if content type is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    
    let fileBuffer: Buffer;
    let fileName: string = fileKey;
    let fileMimeType: string = 'application/octet-stream';

    if (isMultipartFormData(contentType)) {
      // Parse multipart form data
      const formData = await parseMultipartFormData(request as any, contentType);
      
      if (formData.files.length === 0) {
        return {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
          },
          body: JSON.stringify({
            error: 'No file provided in the request.',
          }),
        };
      }

      const uploadedFile = formData.files[0];
      fileBuffer = uploadedFile.data;
      fileName = uploadedFile.fileName;
      fileMimeType = uploadedFile.contentType || getMimeTypeFromExtension(fileName);
    } else {
      // Handle raw binary data
      const body = await request.arrayBuffer();
      fileBuffer = Buffer.from(body);
      fileMimeType = contentType || getMimeTypeFromExtension(fileKey);
    }    context.log(`Uploading file: ${fileKey}, size: ${fileBuffer.length} bytes, type: ${fileMimeType}`);

    // Initialize S3 service with the provided bucket name
    const s3Service = createS3Service(bucketName);

    // Upload file to S3
    const fileInfo = await s3Service.uploadFile(fileKey, fileBuffer, fileMimeType);

    context.log(`File uploaded successfully: ${fileKey}`);    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name, x-file-key, x-file',
      },
      body: JSON.stringify(fileInfo),
    };

  } catch (error: any) {
    context.log('Error in files upload operation:', error.message);
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json',        'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-functions-key, x-bucket-name, x-file-key, x-file',
      },
      body: JSON.stringify({
        error: error.message,
        operation: 'files_upload',
      }),
    };
  }
}

// Register the function with Azure Functions runtime
app.http('files-upload', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function', // Requires Azure Functions key for authentication
  route: 'files-upload',
  handler: filesUpload,
});
