import { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  GetObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  GetBucketLocationCommand,
  PutBucketCorsCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3 service configuration and client
 */
export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

/**
 * File information structure matching the swagger definition
 */
export interface FileInfo {
  ETag: string;
  Key: string;
  LastModified: string;
  Size: number;
}

/**
 * Bucket information structure
 */
export interface BucketInfo {
  Bucket: string;
  Location: string;
  Exists: boolean;
  Created?: boolean;
  CreationDate?: string;
}

/**
 * S3 Service class for handling all S3 operations
 * Implements retry logic, error handling, and connection pooling
 */
export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor(config: S3Config) {
    this.bucketName = config.bucketName;
    
    // Initialize S3 client with retry configuration
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      maxAttempts: 3, // Retry logic for transient failures
      retryMode: 'adaptive',
    });
  }

  /**
   * List objects in S3 bucket with optional prefix filtering
   */
  async listObjects(prefix?: string): Promise<FileInfo[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix || '',
        MaxKeys: 1000, // Reasonable batch size
      });

      const response = await this.client.send(command);
      return (response.Contents || []).map((object: any) => ({
        ETag: object.ETag || '',
        Key: object.Key || '',
        LastModified: object.LastModified?.toISOString() || '',
        Size: object.Size || 0,
      }));
    } catch (error: any) {
      throw new Error(`Failed to list objects: ${error.message}`);
    }
  }

  /**
   * Upload file to S3 bucket
   */
  async uploadFile(key: string, body: Buffer, contentType?: string): Promise<FileInfo> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType || 'application/octet-stream',
      });

      const response = await this.client.send(command);
      
      // Get object metadata after upload
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const headResponse = await this.client.send(headCommand);
      
      return {
        ETag: response.ETag || headResponse.ETag || '',
        Key: key,
        LastModified: headResponse.LastModified?.toISOString() || new Date().toISOString(),
        Size: headResponse.ContentLength || body.length,
      };
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Get file from S3 bucket
   */
  async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('File not found or empty');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      return Buffer.concat(chunks);
    } catch (error: any) {
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for file download
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error: any) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Create a new S3 bucket
   */
  async createBucket(bucketName: string, region?: string): Promise<BucketInfo> {
    try {
      const createBucketConfig = region && region !== 'us-east-1' 
        ? { CreateBucketConfiguration: { LocationConstraint: region as any } }
        : {};

      const command = new CreateBucketCommand({
        Bucket: bucketName,
        ...createBucketConfig,
      });

      await this.client.send(command);
      
      return {
        Bucket: bucketName,
        Location: region || 'us-east-1',
        Exists: true,
        Created: true,
        CreationDate: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
  }

  /**
   * Check if a bucket exists and retrieve its information
   */
  async headBucket(bucketName: string): Promise<BucketInfo> {
    try {
      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await this.client.send(command);
      
      // Get the actual region of the bucket
      let region = 'us-east-1';
      try {
        region = await this.getBucketLocation(bucketName);
      } catch (e) {
        // If we can't get the location, default to us-east-1
      }
      
      return {
        Bucket: bucketName,
        Location: region,
        Exists: true,
        Created: false, // It already existed
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return {
          Bucket: bucketName,
          Location: 'us-east-1',
          Exists: false,
          Created: false,
        };
      }
      throw new Error(`Failed to check bucket: ${error.message}`);
    }
  }
  /**
   * Ensure bucket exists, creating it if necessary, and configure CORS
   */
  async ensureBucket(region?: string): Promise<BucketInfo> {
    try {
      // First, check if the bucket already exists
      const bucketInfo = await this.headBucket(this.bucketName);
      
      let result: BucketInfo;
      if (bucketInfo.Exists) {
        result = bucketInfo;
      } else {
        // Bucket doesn't exist, create it
        result = await this.createBucket(this.bucketName, region);
      }

      // Always configure CORS (whether bucket existed or was just created)
      await this.configureBucketCors(this.bucketName);
      
      return result;
    } catch (error: any) {
      throw new Error(`Failed to ensure bucket: ${error.message}`);
    }
  }

  /**
   * Get the location of an S3 bucket
   */
  async getBucketLocation(bucketName: string): Promise<string> {
    try {
      const command = new GetBucketLocationCommand({
        Bucket: bucketName,
      });

      const response = await this.client.send(command);
      
      // LocationConstraint is only present if the bucket is in a region other than the default (us-east-1)
      return response.LocationConstraint || 'us-east-1';
    } catch (error: any) {
      throw new Error(`Failed to get bucket location: ${error.message}`);
    }
  }

  /**
   * Configure CORS for an S3 bucket with Nintex-compatible settings
   */
  async configureBucketCors(bucketName: string): Promise<void> {
    try {
      const command = new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              ID: 'NintexApps',
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
              AllowedOrigins: ['*'],
              AllowedHeaders: ['*'],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      });

      await this.client.send(command);
    } catch (error: any) {
      throw new Error(`Failed to configure CORS: ${error.message}`);
    }
  }
}

/**
 * Create S3 service instance from environment variables
 * @param bucketName Required bucket name for the S3 operations
 */
export function createS3Service(bucketName: string): S3Service {
  const config: S3Config = {
    region: process.env.AWS_REGION || 'us-west-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucketName: bucketName,
  };

  // Validate configuration
  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error('Missing required S3 configuration. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  if (!config.bucketName) {
    throw new Error('Bucket name is required. Please provide the x-bucket-name header.');
  }

  return new S3Service(config);
}
