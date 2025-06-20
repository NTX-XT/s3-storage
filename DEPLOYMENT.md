# Deployment Guide

This guide helps you deploy the Nintex S3 Bucket Storage Azure Functions to Azure.

## Available Endpoints

After deployment, your Function App will provide these endpoints:

- **POST /api/files** - List files in S3 bucket
- **POST /api/files-upload** - Upload file to S3 bucket  
- **POST /api/files-download** - Download file from S3 bucket
- **GET /api/swagger.json** - OpenAPI/Swagger specification
- **GET /api/swagger** - Interactive Swagger UI
- **GET /api/health** - Health check endpoint

## Prerequisites

1. **Azure Subscription**: You need an active Azure subscription
2. **Azure CLI**: Install the Azure CLI
3. **Azure Functions Core Tools**: Install v4 or later
4. **AWS S3 Access**: S3 bucket and IAM credentials with appropriate permissions

## Required AWS S3 Permissions

Your AWS IAM user/role needs the following permissions for the S3 bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

## Step 1: Create Azure Resources

### Option A: Using Azure CLI

```bash
# Set variables
RESOURCE_GROUP="nintex-bucket-storage-rg"
LOCATION="East US"
STORAGE_ACCOUNT="nintexstorage$(date +%s)"
FUNCTION_APP="nintex-bucket-storage-functions"

# Create resource group
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku Standard_LRS

# Create function app
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location "$LOCATION" \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name $FUNCTION_APP \
  --storage-account $STORAGE_ACCOUNT \
  --disable-app-insights false
```

### Option B: Using Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a **Resource Group**
3. Create a **Storage Account** (General Purpose v2)
4. Create a **Function App**:
   - Runtime: Node.js
   - Version: 18
   - Plan: Consumption (Y1)

## Step 2: Configure Application Settings

Set the following application settings in your Function App:

### Via Azure CLI

```bash
FUNCTION_APP="your-function-app-name"
RESOURCE_GROUP="your-resource-group"

# AWS Configuration
az functionapp config appsettings set \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    "AWS_ACCESS_KEY_ID=your-access-key" \
    "AWS_SECRET_ACCESS_KEY=your-secret-key" \
    "AWS_REGION=us-west-2" \
    "S3_BUCKET_NAME=your-bucket-name" \
    "API_KEY=your-secure-api-key" \
    "CORS_ORIGINS=*"
```

### Via Azure Portal

Navigate to your Function App → Configuration → Application settings and add:

| Name | Value |
|------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret access key |
| `AWS_REGION` | Your S3 bucket region (e.g., us-west-2) |
| `S3_BUCKET_NAME` | Your S3 bucket name |
| `API_KEY` | A secure API key for authentication |
| `CORS_ORIGINS` | Allowed CORS origins (use * for all) |

## Step 3: Deploy the Function

### Option A: Using Azure Functions Core Tools

```bash
# Build the project
npm run build

# Deploy to Azure
func azure functionapp publish your-function-app-name
```

### Option B: Using VS Code

1. Install the **Azure Functions** extension
2. Sign in to Azure
3. Right-click your Function App in the Azure panel
4. Select **Deploy to Function App**
5. Choose your built project folder

### Option C: Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure Functions

on:
  push:
    branches: [ main ]
    paths: [ 's3-bucket-storage/**' ]

jobs:
  deploy:
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
    
    - name: Build project
      run: |
        cd s3-bucket-storage
        npm run build
    
    - name: Deploy to Azure Functions
      uses: Azure/functions-action@v1
      with:
        app-name: your-function-app-name
        package: 's3-bucket-storage'
        publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

## Step 4: Test the Deployment

### Health Check

```bash
curl https://your-function-app.azurewebsites.net/api/health
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
curl -X POST https://your-function-app.azurewebsites.net/api/files \
  -H "Api-Key: your-api-key" \
  -H "Content-Type: application/json"
```

### Upload File

```bash
curl -X POST https://your-function-app.azurewebsites.net/api/files-upload \
  -H "Api-Key: your-api-key" \
  -H "x-file-key: test/sample.txt" \
  -F "file=@sample.txt"
```

### Download File

```bash
curl -X POST https://your-function-app.azurewebsites.net/api/files-download \
  -H "Api-Key: your-api-key" \
  -H "x-file-key: test/sample.txt" \
  -v
```

## Step 5: Configure for Nintex

1. **Update Swagger File**: Edit `swagger.json` and replace the host with your Function App URL
2. **Import to Nintex**: Upload the updated swagger.json as a custom Xtension
3. **Configure Connection**: Set up the connection with your Function App URL and API key

### Updated Swagger Host

```json
{
  "host": "your-function-app.azurewebsites.net",
  "x-ntx-host": "your-function-app.azurewebsites.net"
}
```

## Security Best Practices

### 1. Use Azure Key Vault (Recommended)

Instead of storing secrets in Application Settings:

```bash
# Create Key Vault
az keyvault create \
  --name "nintex-bucket-storage-kv" \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION"

# Store secrets
az keyvault secret set --vault-name "nintex-bucket-storage-kv" --name "aws-access-key" --value "your-access-key"
az keyvault secret set --vault-name "nintex-bucket-storage-kv" --name "aws-secret-key" --value "your-secret-key"

# Configure Function App to use Key Vault references
az functionapp config appsettings set \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \    "AWS_ACCESS_KEY_ID=@Microsoft.KeyVault(VaultName=nintex-bucket-storage-kv;SecretName=aws-access-key)" \
    "AWS_SECRET_ACCESS_KEY=@Microsoft.KeyVault(VaultName=nintex-bucket-storage-kv;SecretName=aws-secret-key)"
```

### 2. Enable System-Assigned Managed Identity

```bash
# Enable managed identity
az functionapp identity assign \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP

# Grant access to Key Vault
az keyvault set-policy \
  --name "nintex-bucket-storage-kv" \
  --resource-group $RESOURCE_GROUP \
  --object-id $(az functionapp identity show --name $FUNCTION_APP --resource-group $RESOURCE_GROUP --query principalId -o tsv) \
  --secret-permissions get
```

### 3. Restrict CORS Origins

Update the `CORS_ORIGINS` setting to include only your Nintex domain:

```bash
az functionapp config appsettings set \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --settings "CORS_ORIGINS=https://your-nintex-domain.com"
```

## Monitoring and Troubleshooting

### Application Insights

Your Function App automatically creates an Application Insights instance. Use it to:

- Monitor performance
- Track errors and exceptions
- Set up alerts
- View live metrics

### View Logs

```bash
# Stream logs in real-time
az functionapp log tail --name $FUNCTION_APP --resource-group $RESOURCE_GROUP

# Download logs
az functionapp log download --name $FUNCTION_APP --resource-group $RESOURCE_GROUP
```

### Common Issues

1. **"Function not found"**: Ensure the build succeeded and all functions are registered
2. **"Missing S3 credentials"**: Verify application settings are correctly configured
3. **"CORS errors"**: Check CORS_ORIGINS setting and ensure preflight requests are handled
4. **"File upload fails"**: Verify S3 permissions and bucket configuration

## Scaling and Performance

### Consumption Plan Limits

- **Timeout**: 5 minutes (configurable up to 10 minutes)
- **Memory**: 1.5 GB
- **File Size**: Limited by timeout and memory

### Premium Plan (if needed)

For larger files or higher performance:

```bash
# Create Premium plan
az functionapp plan create \
  --resource-group $RESOURCE_GROUP \  --name nintex-bucket-storage-premium \
  --location "$LOCATION" \
  --sku EP1

# Update Function App to use Premium plan
az functionapp update \
  --name $FUNCTION_APP \
  --resource-group $RESOURCE_GROUP \
  --plan nintex-bucket-storage-premium
```

## Cost Optimization

- **Use Consumption Plan**: Only pay for execution time
- **Optimize S3 Storage Class**: Use appropriate storage classes for your files
- **Monitor Usage**: Set up billing alerts and cost management
- **Clean Up Resources**: Remove unused resources regularly

## Support and Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Monitoring**: Set up alerts for errors and performance issues
3. **Backup Strategy**: Ensure S3 bucket has appropriate backup/versioning
4. **Documentation**: Keep deployment and configuration documented
