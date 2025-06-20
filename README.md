# S3 Bucket Storage for Nintex

Azure Functions implementation providing S3 bucket storage operations for Nintex Cloud Automation CE workflows. Exposes RESTful endpoints for file management using Amazon S3 as the backend storage provider.

## Operations

- **List files** - Retrieve file listings with optional path prefix filtering
- **Upload files** - Store files via multipart form data or binary upload
- **Download files** - Generate presigned URLs via 303 redirect for direct S3 access
- **Bucket management** - Ensure bucket exists and configure CORS settings

## API Documentation

API specification available at:
- Interactive documentation: `https://your-function-app.azurewebsites.net/api/swagger`
- OpenAPI specification: `https://your-function-app.azurewebsites.net/api/swagger.json`

Operation IDs: `files`, `files_upload`, `files_download`, `ensure-bucket`

## Deployment

### PowerShell

```powershell
git clone https://github.com/your-org/s3-bucket-storage.git
cd s3-bucket-storage
npm install
npm run build
az login

$resourceGroup = "s3-storage-rg"
$functionApp = "your-s3-storage-app" 
$location = "East US"

az group create --name $resourceGroup --location $location
az functionapp create --resource-group $resourceGroup --consumption-plan-location $location --runtime node --runtime-version 18 --functions-version 4 --name $functionApp --storage-account yourstorageaccount
func azure functionapp publish $functionApp
```

### Configuration

```powershell
az functionapp config appsettings set --name $functionApp --resource-group $resourceGroup --settings `
  "AWS_ACCESS_KEY_ID=your_access_key" `
  "AWS_SECRET_ACCESS_KEY=your_secret_key" `
  "AWS_REGION=us-west-2" `
  "CORS_ORIGINS=*"
```

### Verification

```powershell
$baseUrl = "https://$functionApp.azurewebsites.net/api"
Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Azure CLI and alternative deployment methods.

## Nintex Cloud Automation CE Integration

1. Navigate to **Xtensions** > **Private** > **Create**
2. Select **OpenAPI/Swagger**
3. Enter Swagger URL: `https://your-function-app.azurewebsites.net/api/swagger.json`
4. Configure authentication with your Azure Functions key

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key with S3 permissions |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key |
| `AWS_REGION` | AWS region for S3 operations |
| `CORS_ORIGINS` | Allowed CORS origins (optional, defaults to `*`) |

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-functions-key` | Yes | Azure Functions authentication key |
| `x-bucket-name` | Yes | S3 bucket name for operation |
| `x-file-path` | No | Path prefix filter for list operations |
| `x-file-key` | Context | Full file path for upload/download operations |

### Local Development

```powershell
npm install
Copy-Item "local.settings.json.example" "local.settings.json"
# Edit local.settings.json with configuration values
npm run build
npm start
```

Local API available at: `http://localhost:7071/api/swagger`

## Architecture

**Runtime**: Azure Functions v4 (Node.js 18)  
**Language**: TypeScript  
**Storage**: Amazon S3  
**Authentication**: API Key  
**Documentation**: OpenAPI/Swagger 2.0

### Components
- **S3Service**: S3 operations with retry logic
- **Form Parser**: Multipart form data handling
- **CORS Configuration**: S3 bucket CORS management
- **Error Handling**: HTTP status code responses

### Security
- Azure Functions key authentication on all endpoints
- Configurable CORS origins
- Presigned URLs for downloads (1-hour expiration)
- 100MB upload size limit
- Input validation

## Monitoring

### Health Check
```powershell
Invoke-RestMethod -Uri "https://your-function-app.azurewebsites.net/api/health"
```

### Common Issues
- **Authentication**: Verify Azure Functions key is accessible and x-functions-key header is provided
- **S3 Connection**: Check AWS credentials, bucket existence, and region configuration
- **File Upload**: Verify file size limits, Content-Type headers, and x-file-key format
- **File Download**: Returns 303 redirect - clients must follow redirect to access file content

### Logging
Azure Application Insights provides request/response logging, error tracking, and performance metrics.

## Project Structure

```
src/
├── functions/           # Azure Function endpoints
│   ├── files.ts        # List files operation
│   ├── filesUpload.ts  # Upload file operation
│   ├── filesDownload.ts # Download file operation
│   └── ensureBucket.ts # Bucket management
├── shared/
│   ├── s3Service.ts    # S3 client and operations
│   └── formParser.ts   # Multipart form parsing
└── index.ts            # Function app registration
```

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [test-api.http](./test-api.http) - API testing examples  
- [swagger.json](./swagger.json) - OpenAPI specification