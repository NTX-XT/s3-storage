import { IncomingMessage } from 'http';
import busboy from 'busboy';

/**
 * Parsed file from multipart form data
 */
export interface ParsedFile {
  fieldName: string;
  fileName: string;
  contentType: string;
  data: Buffer;
}

/**
 * Parsed form data
 */
export interface ParsedFormData {
  files: ParsedFile[];
  fields: Record<string, string>;
}

/**
 * Extended request interface for Azure Functions
 */
interface AzureFunctionRequest extends IncomingMessage {
  body?: any;
}

/**
 * Parse multipart/form-data from HTTP request
 * This utility handles file uploads in Azure Functions
 */
export function parseMultipartFormData(req: AzureFunctionRequest, contentType: string): Promise<ParsedFormData> {
  return new Promise((resolve, reject) => {
    const files: ParsedFile[] = [];
    const fields: Record<string, string> = {};

    try {      const bb = busboy({ 
        headers: { 'content-type': contentType },
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB limit
          files: 1, // Only allow one file upload
        }
      });

      bb.on('file', (fieldName: string, file: any, info: any) => {
        const { filename, mimeType } = info;
        const chunks: Buffer[] = [];

        file.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        file.on('end', () => {
          files.push({
            fieldName,
            fileName: filename || 'unknown',
            contentType: mimeType || 'application/octet-stream',
            data: Buffer.concat(chunks),
          });
        });

        file.on('error', (error: Error) => {
          reject(new Error(`File upload error: ${error.message}`));
        });
      });

      bb.on('field', (fieldName: string, value: string) => {
        fields[fieldName] = value;
      });

      bb.on('finish', () => {
        resolve({ files, fields });
      });

      bb.on('error', (error: Error) => {
        reject(new Error(`Form parsing error: ${error.message}`));
      });

      // Write request data to busboy
      if (req.body) {
        if (Buffer.isBuffer(req.body)) {
          bb.write(req.body);
        } else if (typeof req.body === 'string') {
          bb.write(Buffer.from(req.body, 'binary'));
        } else {
          bb.write(Buffer.from(JSON.stringify(req.body)));
        }
      }
      
      bb.end();
    } catch (error: any) {
      reject(new Error(`Failed to initialize form parser: ${error.message}`));
    }
  });
}

/**
 * Extract file key from various sources (header, body, etc.)
 */
export function extractFileKey(headers: Record<string, string>, body?: any): string {
  // Check headers first (x-file-key)
  const headerKey = headers['x-file-key'] || headers['X-File-Key'];
  if (headerKey) return headerKey;

  // Check body if it's JSON
  if (body && typeof body === 'object') {
    if (body.key || body.fileKey) return body.key || body.fileKey;
  }

  throw new Error('File key not provided. Please specify x-file-key header.');
}

/**
 * Extract file path prefix from headers
 */
export function extractFilePath(headers: Record<string, string>): string {
  const filePath = headers['x-file-path'] || headers['X-File-Path'] || '';
  return filePath.trim();
}

/**
 * Validate content type for multipart form data
 */
export function isMultipartFormData(contentType: string): boolean {
  return !!(contentType && contentType.toLowerCase().startsWith('multipart/form-data'));
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}
