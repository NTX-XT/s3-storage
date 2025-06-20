# Get Azure Function App Master Key and Display Useful URLs
# This script helps you get the master key for your deployed Azure Function App
# and displays useful URLs for testing the S3 Storage API

param(
    [Parameter(Mandatory = $true)]
    [string]$FunctionAppName,
    
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $false)]
    [string]$SubscriptionId
)

Write-Host "=====================================" -ForegroundColor Green
Write-Host "Azure Functions S3 Storage API Helper" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Set subscription if provided
if ($SubscriptionId) {
    Write-Host "Setting subscription: $SubscriptionId" -ForegroundColor Yellow
    az account set --subscription $SubscriptionId
}

# Get resource group if not provided
if (-not $ResourceGroupName) {
    Write-Host "Looking up resource group for Function App: $FunctionAppName" -ForegroundColor Yellow
    $ResourceGroupName = az functionapp show --name $FunctionAppName --query "resourceGroup" --output tsv
    
    if (-not $ResourceGroupName) {
        Write-Host "ERROR: Could not find Function App '$FunctionAppName'" -ForegroundColor Red
        Write-Host "Please check the name and ensure you're logged into the correct Azure subscription." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Found resource group: $ResourceGroupName" -ForegroundColor Green
}

try {
    Write-Host "Getting master key for Function App: $FunctionAppName" -ForegroundColor Yellow
    
    # Get the master key
    $masterKey = az functionapp keys list --name $FunctionAppName --resource-group $ResourceGroupName --query "masterKey" --output tsv
    
    if (-not $masterKey) {
        Write-Host "ERROR: Could not retrieve master key" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "=== FUNCTION APP DETAILS ===" -ForegroundColor Cyan
    Write-Host "Function App: $FunctionAppName" -ForegroundColor White
    Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor White
    Write-Host "Master Key: $masterKey" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "=== API ENDPOINTS ===" -ForegroundColor Cyan
    Write-Host "Base URL: https://$FunctionAppName.azurewebsites.net" -ForegroundColor White
    Write-Host "Health Check: https://$FunctionAppName.azurewebsites.net/api/health" -ForegroundColor White
    Write-Host "Files List: https://$FunctionAppName.azurewebsites.net/api/files" -ForegroundColor White
    Write-Host "Files Upload: https://$FunctionAppName.azurewebsites.net/api/files-upload" -ForegroundColor White
    Write-Host "Files Download: https://$FunctionAppName.azurewebsites.net/api/files-download" -ForegroundColor White
    
    Write-Host ""
    Write-Host "=== SWAGGER DOCUMENTATION ===" -ForegroundColor Yellow
    Write-Host "Swagger UI: https://$FunctionAppName.azurewebsites.net/api/swagger" -ForegroundColor White
    Write-Host "Swagger JSON: https://$FunctionAppName.azurewebsites.net/api/swagger.json" -ForegroundColor White
    
    Write-Host ""
    Write-Host "=== TESTING COMMANDS ===" -ForegroundColor Magenta
    Write-Host "# Test health check (no auth required):" -ForegroundColor Gray
    Write-Host "curl https://$FunctionAppName.azurewebsites.net/api/health" -ForegroundColor White
    Write-Host ""
    Write-Host "# Test file listing (requires function key and bucket name):" -ForegroundColor Gray
    Write-Host "curl -X POST 'https://$FunctionAppName.azurewebsites.net/api/files' \\" -ForegroundColor White
    Write-Host "  -H 'x-functions-key: $masterKey' \\" -ForegroundColor White
    Write-Host "  -H 'x-bucket-name: your-bucket-name' \\" -ForegroundColor White
    Write-Host "  -H 'Content-Type: application/json'" -ForegroundColor White
    Write-Host ""
    Write-Host "# Test file upload (requires function key and bucket name):" -ForegroundColor Gray
    Write-Host "curl -X POST 'https://$FunctionAppName.azurewebsites.net/api/files-upload' \\" -ForegroundColor White
    Write-Host "  -H 'x-functions-key: $masterKey' \\" -ForegroundColor White
    Write-Host "  -H 'x-bucket-name: your-bucket-name' \\" -ForegroundColor White
    Write-Host "  -H 'x-file-key: test-files/sample.txt' \\" -ForegroundColor White
    Write-Host "  -F 'file=@local-file.txt'" -ForegroundColor White
    Write-Host ""
    Write-Host "# Test Swagger JSON (no auth required):" -ForegroundColor Gray
    Write-Host "curl https://$FunctionAppName.azurewebsites.net/api/swagger.json" -ForegroundColor White
    
    Write-Host ""
    Write-Host "=== AUTHENTICATION REQUIREMENTS ===" -ForegroundColor Red
    Write-Host "This API requires TWO authentication keys:" -ForegroundColor Yellow
    Write-Host "1. x-functions-key: Azure Functions authentication (use master key above)" -ForegroundColor White
    Write-Host "2. x-bucket-name: S3 bucket name for tenant isolation" -ForegroundColor White
    Write-Host ""
    Write-Host "=== NEXT STEPS ===" -ForegroundColor Green
    Write-Host "1. Test the Swagger UI in your browser: https://$FunctionAppName.azurewebsites.net/api/swagger" -ForegroundColor White
    Write-Host "2. Configure your S3 credentials in the Function App settings" -ForegroundColor White
    Write-Host "3. Test with a real S3 bucket name in the x-bucket-name header" -ForegroundColor White
    Write-Host ""
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure you are logged in to Azure CLI and have access to the Function App." -ForegroundColor Yellow
}

Write-Host "=====================================" -ForegroundColor Green
