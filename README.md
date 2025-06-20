# Nintex S3 Bucket Storage - Azure Functions Implementation

This is an Azure Functions implementation of the Nintex S3 Bucket Storage integration, originally built as a Prismatic integration. It provides a RESTful API for file storage operations using Amazon S3 as the backend.

## Features

- **File Listing**: List all files in an S3 bucket with optional prefix filtering
- **File Upload**: Upload files to S3 bucket via multipart form data or raw binary
- **File Download**: Generate presigned URLs for secure file downloads
- **API Key Authentication**: Secure endpoints with API key validation
- **CORS Support**: Cross-origin resource sharing for web applications
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## API Endpoints

All endpoints maintain compatibility with the original Prismatic integration swagger specification:

### API Documentation Endpoints

#### GET /api/swagger.json
Returns the OpenAPI/Swagger specification for the API in JSON format.

#### GET /api/swagger
Interactive Swagger UI for testing and exploring the API endpoints.

### File Operations

### POST /api/files
List all files in the S3 bucket.

**Headers:**
- `Api-Key`: Your API key for authentication
- `x-file-path` (optional): Prefix to filter files by path

**Response:** Array of file information objects

### POST /api/files-upload
Upload a file to the S3 bucket.

**Headers:**
- `Api-Key`: Your API key for authentication
- `x-file-key`: The full path/key where the file should be stored

**Body:** Multipart form data with the file, or raw binary data

**Response:** File information object

### POST /api/files-download
Get a download URL for a file.

**Headers:**
- `Api-Key`: Your API key for authentication
- `x-file-key`: The full path/key of the file to download

**Response:** 303 redirect to presigned S3 URL

### GET /api/health
Health check endpoint.

**Response:** Service status information

## Environment Configuration

Configure the following environment variables:

```bash
# Azure Functions
AzureWebJobsStorage=UseDevelopmentStorage=true
FUNCTIONS_WORKER_RUNTIME=node
FUNCTIONS_EXTENSION_VERSION=~4

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-west-2
S3_BUCKET_NAME=your-bucket-name

# Security
API_KEY=your-secure-api-key

# CORS
CORS_ORIGINS=*
```

## Local Development

### Prerequisites

- Node.js 18+
- Azure Functions Core Tools v4
- AWS S3 bucket and credentials

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure local settings:**
   Update `local.settings.json` with your AWS credentials and configuration.

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Start the local development server:**
   ```bash
   npm start
   ```

The functions will be available at `http://localhost:7071/api/`

### Development Scripts

```bash
npm run build        # Compile TypeScript
npm run watch        # Watch mode for development
npm run clean        # Clean build artifacts
npm start           # Start local development server
npm test            # Run tests
```

## Deployment

### Azure Portal

1. Create an Azure Function App with Node.js 18 runtime
2. Configure Application Settings with the environment variables
3. Deploy the built application

### Azure CLI

```bash
# Build the project
npm run build

# Deploy to Azure (requires Azure CLI and proper authentication)
func azure functionapp publish your-function-app-name
```

### CI/CD Pipeline

The project is ready for GitHub Actions or Azure DevOps pipelines. Ensure environment variables are configured in your deployment environment.

## Architecture

### Technology Stack

- **Runtime**: Azure Functions v4 with Node.js 18
- **Language**: TypeScript
- **AWS SDK**: Latest AWS SDK v3 for S3 operations
- **File Parsing**: Busboy for multipart form data handling

### Project Structure

```
src/
├── shared/
│   ├── s3Service.ts      # S3 client and operations
│   └── formParser.ts     # Multipart form data parsing
├── functions/
│   ├── files.ts          # List files endpoint
│   ├── filesUpload.ts    # Upload file endpoint
│   └── filesDownload.ts  # Download file endpoint
└── index.ts              # Main entry point

```

### Key Design Decisions

1. **Azure Functions v4 Programming Model**: Uses the latest programming model for better performance and developer experience
2. **AWS SDK v3**: Modern, modular AWS SDK with improved performance and TypeScript support
3. **Retry Logic**: Built-in retry mechanisms for S3 operations with exponential backoff
4. **Security**: API key authentication and CORS configuration
5. **Error Handling**: Comprehensive error handling with proper HTTP status codes
6. **Compatibility**: Maintains exact compatibility with the original Prismatic integration API

## Security Considerations

- **API Key Authentication**: All endpoints require a valid API key
- **CORS Configuration**: Configurable CORS origins for web security
- **AWS Credentials**: Use IAM roles in production, never hardcode credentials
- **File Size Limits**: 100MB upload limit (configurable)
- **Presigned URLs**: Secure, time-limited download URLs (1 hour expiration)

## Monitoring and Logging

The application includes comprehensive logging:

- Request/response logging
- Error logging with stack traces
- Performance metrics for S3 operations
- Health check endpoint for monitoring

Use Azure Application Insights for production monitoring and alerting.

## Nintex Integration

This implementation maintains full compatibility with the original Nintex Automation Cloud Xtension:

- **Operation IDs**: `files`, `files_upload`, `files_download`
- **Request/Response Formats**: Identical to Prismatic integration
- **Header Parameters**: Same parameter names and validation
- **Security Definitions**: Compatible API key authentication

To use with Nintex:

1. Deploy the Azure Functions app
2. Update the swagger.json with your function app URL
3. Import as a custom Xtension in Nintex Automation Cloud
4. Configure with your API key and S3 credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

1. Check the Azure Functions logs
2. Verify AWS S3 permissions and configuration
3. Review the API documentation
4. Check environment variables configuration

## Related Projects

- **Original Prismatic Integration**: Located in `../prismatic/integrations/nintex-bucket-storage.yaml`
- **JSON Tools Functions**: Located in `../json-tools/` - Azure Functions for JSON manipulation