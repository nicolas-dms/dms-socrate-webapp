#!/bin/bash
# Regenerate Azure Service Principal Credentials for GitHub Actions
# This script creates/resets the service principal with the correct format

set -e

echo "=========================================="
echo "Azure Service Principal Setup for GitHub"
echo "=========================================="
echo ""

# Configuration
SP_NAME="github-exominutes-webapp-deploy"
SUBSCRIPTION_ID="dc247650-4ab3-4b8e-bec7-2286ecf3ff7c"

echo "Subscription ID: $SUBSCRIPTION_ID"
echo "Service Principal Name: $SP_NAME"
echo ""

# Set subscription
echo "📌 Setting Azure subscription..."
az account set --subscription $SUBSCRIPTION_ID
echo "✅ Using subscription: $(az account show --query name -o tsv)"
echo ""

# Check if service principal exists
echo "🔍 Checking if service principal exists..."
SP_EXISTS=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -z "$SP_EXISTS" ]; then
    echo "📝 Service principal does not exist. Creating new one..."
    echo ""
    
    # Create new service principal with --json-auth
    echo "Creating service principal with correct JSON format..."
    az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --role contributor \
        --scopes /subscriptions/$SUBSCRIPTION_ID \
        --json-auth > sp_credentials.json
    
    echo ""
    echo "✅ Service principal created!"
else
    echo "✅ Service principal already exists (App ID: $SP_EXISTS)"
    echo "🔄 Resetting credentials..."
    echo ""
    
    # Reset credentials
    az ad sp credential reset \
        --id $SP_EXISTS \
        --query '{clientId:appId, clientSecret:password, tenantId:tenant, subscriptionId:"'$SUBSCRIPTION_ID'"}' \
        -o json > sp_credentials.json
    
    echo ""
    echo "✅ Credentials reset!"
fi

echo ""
echo "=========================================="
echo "📋 AZURE_CREDENTIALS Secret Value"
echo "=========================================="
echo ""
echo "Copy the JSON below and paste it into GitHub:"
echo ""
echo "GitHub → Settings → Secrets → AZURE_CREDENTIALS → Update"
echo ""
cat sp_credentials.json
echo ""
echo ""
echo "=========================================="
echo "🔐 Security Note"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: The file 'sp_credentials.json' contains sensitive credentials!"
echo ""
echo "After copying to GitHub, DELETE the file:"
echo "  rm sp_credentials.json"
echo ""
echo "=========================================="
