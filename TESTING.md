# Testing Guide

This guide provides instructions for testing the Nintex S3 Bucket Storage Azure Functions both locally and after deployment.

## Local Testing

### Prerequisites

1. **Configure Local Settings**: Update `local.settings.json` with your AWS credentials
2. **Start Local Server**: Run `npm start` to start the Azure Functions runtime
3. **Test Endpoints**: Use the test commands below

### Health Check

```bash
curl http://localhost:7071/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "service": "Nintex S3 Bucket Storage Azure Functions"
}
```

### List Files

```bash
# List all files
curl -X POST http://localhost:7071/api/files \
  -H "Api-Key: test-key" \
  -H "Content-Type: application/json"

# List files with prefix
curl -X POST http://localhost:7071/api/files \
  -H "Api-Key: test-key" \
  -H "x-file-path: documents/" \
  -H "Content-Type: application/json"
```

### Upload File

```bash
# Create a test file
echo "Hello, Nintex S3 Bucket Storage!" > test-file.txt

# Upload via multipart form data
curl -X POST http://localhost:7071/api/files-upload \
  -H "Api-Key: test-key" \
  -H "x-file-key: test/hello.txt" \
  -F "file=@test-file.txt"

# Upload via raw binary (example with JSON)
curl -X POST http://localhost:7071/api/files-upload \
  -H "Api-Key: test-key" \
  -H "x-file-key: test/data.json" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from Azure Functions!"}'
```

### Download File

```bash
# This will return a 303 redirect to the S3 presigned URL
curl -X POST http://localhost:7071/api/files-download \
  -H "Api-Key: test-key" \
  -H "x-file-key: test/hello.txt" \
  -v

# Follow the redirect to actually download
curl -X POST http://localhost:7071/api/files-download \
  -H "Api-Key: test-key" \
  -H "x-file-key: test/hello.txt" \
  -L
```

## Production Testing

Replace `localhost:7071` with your Azure Function App URL:

```bash
BASE_URL="https://your-function-app.azurewebsites.net"
API_KEY="your-production-api-key"

# Health check
curl $BASE_URL/api/health

# List files
curl -X POST $BASE_URL/api/files \
  -H "Api-Key: $API_KEY" \
  -H "Content-Type: application/json"

# Upload file
curl -X POST $BASE_URL/api/files-upload \
  -H "Api-Key: $API_KEY" \
  -H "x-file-key: production-test/sample.txt" \
  -F "file=@test-file.txt"

# Download file
curl -X POST $BASE_URL/api/files-download \
  -H "Api-Key: $API_KEY" \
  -H "x-file-key: production-test/sample.txt" \
  -v
```

## PowerShell Testing Scripts

### Windows PowerShell

```powershell
# Set variables
$baseUrl = "http://localhost:7071"  # or your production URL
$apiKey = "test-key"                # or your production API key

# Health check
Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET

# List files
$headers = @{
    "Api-Key" = $apiKey
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "$baseUrl/api/files" -Method POST -Headers $headers

# Upload file
$uploadHeaders = @{
    "Api-Key" = $apiKey
    "x-file-key" = "test/powershell-upload.txt"
}
$body = @{
    file = Get-Item "test-file.txt"
}
Invoke-RestMethod -Uri "$baseUrl/api/files-upload" -Method POST -Headers $uploadHeaders -Form $body

# Download file (get redirect URL)
$downloadHeaders = @{
    "Api-Key" = $apiKey
    "x-file-key" = "test/powershell-upload.txt"
}
try {
    Invoke-RestMethod -Uri "$baseUrl/api/files-download" -Method POST -Headers $downloadHeaders
} catch {
    if ($_.Exception.Response.StatusCode -eq 303) {
        $redirectUrl = $_.Exception.Response.Headers.Location
        Write-Host "Download URL: $redirectUrl"
        # Download the actual file
        Invoke-WebRequest -Uri $redirectUrl -OutFile "downloaded-file.txt"
    }
}
```

## Postman Collection

Create a Postman collection with the following requests:

### Environment Variables
- `baseUrl`: `http://localhost:7071` (local) or `https://your-function-app.azurewebsites.net` (production)
- `apiKey`: Your API key

### 1. Health Check
- **Method**: GET
- **URL**: `{{baseUrl}}/api/health`

### 2. List Files
- **Method**: POST
- **URL**: `{{baseUrl}}/api/files`
- **Headers**:
  - `Api-Key`: `{{apiKey}}`
  - `Content-Type`: `application/json`
- **Optional Headers**:
  - `x-file-path`: `documents/` (for filtering)

### 3. Upload File
- **Method**: POST
- **URL**: `{{baseUrl}}/api/files-upload`
- **Headers**:
  - `Api-Key`: `{{apiKey}}`
  - `x-file-key`: `test/uploaded-file.txt`
- **Body**: Form-data with a file field

### 4. Download File
- **Method**: POST
- **URL**: `{{baseUrl}}/api/files-download`
- **Headers**:
  - `Api-Key`: `{{apiKey}}`
  - `x-file-key`: `test/uploaded-file.txt`
- **Settings**: Disable "Automatically follow redirects" to see the 303 response

## API Documentation

### Swagger UI (Interactive Testing)

Access the interactive Swagger UI for testing endpoints:

**Local:**
```bash
http://localhost:7071/api/swagger
```

**Deployed:**
```bash
https://your-function-app.azurewebsites.net/api/swagger
```

### Swagger JSON Specification

Get the OpenAPI specification in JSON format:

**Local:**
```bash
curl http://localhost:7071/api/swagger.json
```

**Deployed:**
```bash
curl https://your-function-app.azurewebsites.net/api/swagger.json
```

## Error Testing

### Invalid API Key
```bash
curl -X POST http://localhost:7071/api/files \
  -H "Api-Key: invalid-key" \
  -H "Content-Type: application/json"
```
Expected: 401 Unauthorized

### Missing File Key
```bash
curl -X POST http://localhost:7071/api/files-upload \
  -H "Api-Key: test-key" \
  -F "file=@test-file.txt"
```
Expected: 400 Bad Request

### Non-existent File Download
```bash
curl -X POST http://localhost:7071/api/files-download \
  -H "Api-Key: test-key" \
  -H "x-file-key: non-existent-file.txt" \
  -v
```
Expected: 500 Internal Server Error with S3 error

## Performance Testing

### Upload Large File
```bash
# Create a 10MB test file
dd if=/dev/zero of=large-file.bin bs=1024 count=10240

# Upload it
curl -X POST http://localhost:7071/api/files-upload \
  -H "Api-Key: test-key" \
  -H "x-file-key: test/large-file.bin" \
  -F "file=@large-file.bin" \
  --progress-bar
```

### Concurrent Uploads
```bash
# Upload multiple files concurrently
for i in {1..5}; do
  echo "Test file $i" > "test-file-$i.txt"
  curl -X POST http://localhost:7071/api/files-upload \
    -H "Api-Key: test-key" \
    -H "x-file-key: test/concurrent-$i.txt" \
    -F "file=@test-file-$i.txt" &
done
wait
```

## Nintex Integration Testing

### Prerequisites
1. Deploy the Azure Functions to Azure
2. Update `swagger.json` with your Function App URL
3. Import as custom Xtension in Nintex

### Test Workflow
Create a simple Nintex workflow that:

1. **Lists files** using the `files` operation
2. **Uploads a file** using the `files_upload` operation
3. **Downloads the file** using the `files_download` operation

### Sample Nintex Workflow Configuration

```yaml
# Connection Configuration
api_key: "your-production-api-key"
function_app_url: "https://your-function-app.azurewebsites.net"

# Test Operations
operations:
  - name: "List Files"
    operation_id: "files"
    headers:
      x-file-path: "nintex-test/"
  
  - name: "Upload File"
    operation_id: "files_upload"
    headers:
      x-file-key: "nintex-test/workflow-test.txt"
    file: "Test content from Nintex workflow"
  
  - name: "Download File"
    operation_id: "files_download"
    headers:
      x-file-key: "nintex-test/workflow-test.txt"
```

## Automated Testing

### Jest Test Suite

The project includes Jest for automated testing. Run tests with:

```bash
npm test
```

### GitHub Actions Testing

Add to `.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 's3-bucket-storage/package-lock.json'
      - name: Install dependencies
      run: |
        cd s3-bucket-storage
        npm ci
    
    - name: Run tests
      run: |
        cd s3-bucket-storage
        npm test
    
    - name: Build project
      run: |
        cd s3-bucket-storage
        npm run build
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS_ORIGINS is configured correctly
2. **File Upload Fails**: Check file size limits and S3 permissions
3. **Download Returns 500**: Verify file exists in S3 and key is correct
4. **Authentication Fails**: Confirm API_KEY environment variable is set

### Debug Mode

Enable debug logging by setting `WEBSITE_NODE_DEFAULT_VERSION=~18` and check Application Insights for detailed logs.

### Local S3 Testing

For local testing without AWS, consider using LocalStack:

```bash
# Start LocalStack
docker run --rm -it -p 4566:4566 -p 4571:4571 localstack/localstack

# Update local.settings.json
{
  "Values": {
    "AWS_ACCESS_KEY_ID": "test",
    "AWS_SECRET_ACCESS_KEY": "test",
    "AWS_REGION": "us-east-1",
    "AWS_ENDPOINT_URL": "http://localhost:4566"
  }
}
```
