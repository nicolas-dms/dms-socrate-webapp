#!/bin/bash
# Azure Resources Setup Script for ExoMinutes WebApp
# This script creates all necessary Azure resources for the deployment pipeline

set -e

echo "================================================"
echo "ExoMinutes WebApp - Azure Resources Setup"
echo "================================================"
echo ""

# Configuration
SUBSCRIPTION_ID="dc247650-4ab3-4b8e-bec7-2286ecf3ff7c"
LOCATION="francecentral"
ACR_NAME="exominutesacr"

# Test Environment
RG_TEST="rg-exominute-test"
WEBAPP_TEST="aca-exominutes-webapp-test"

# Production Environment
RG_PROD="rg-exominute-prod"
WEBAPP_PROD="aca-exominutes-webapp-prod"

# Set subscription
echo "📌 Setting Azure subscription..."
az account set --subscription $SUBSCRIPTION_ID
echo "✅ Subscription set: $(az account show --query name -o tsv)"
echo ""

# Check if ACR exists
echo "🔍 Checking Container Registry..."
if az acr show --name $ACR_NAME &>/dev/null; then
    echo "✅ ACR '$ACR_NAME' already exists"
else
    echo "⚠️  ACR '$ACR_NAME' not found"
    echo "   Please create it manually or update the ACR_NAME variable"
fi
echo ""

# ==============================================
# TEST ENVIRONMENT
# ==============================================

echo "================================================"
echo "TEST ENVIRONMENT SETUP"
echo "================================================"
echo ""

# Create test resource group
echo "📦 Creating test resource group..."
if az group show --name $RG_TEST &>/dev/null; then
    echo "✅ Resource group '$RG_TEST' already exists"
else
    az group create \
        --name $RG_TEST \
        --location $LOCATION
    echo "✅ Resource group '$RG_TEST' created"
fi
echo ""

# Create test Container App Environment
echo "🌍 Creating test Container App Environment..."
ENV_TEST="env-exominutes-test"
if az containerapp env show --name $ENV_TEST --resource-group $RG_TEST &>/dev/null; then
    echo "✅ Container App Environment '$ENV_TEST' already exists"
else
    az containerapp env create \
        --name $ENV_TEST \
        --resource-group $RG_TEST \
        --location $LOCATION
    echo "✅ Container App Environment '$ENV_TEST' created"
fi
echo ""

# Create test Container App
echo "🚀 Creating test Container App..."
if az containerapp show --name $WEBAPP_TEST --resource-group $RG_TEST &>/dev/null; then
    echo "✅ Container App '$WEBAPP_TEST' already exists"
else
    az containerapp create \
        --name $WEBAPP_TEST \
        --resource-group $RG_TEST \
        --environment $ENV_TEST \
        --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
        --target-port 3000 \
        --ingress external \
        --registry-server ${ACR_NAME}.azurecr.io \
        --cpu 0.5 \
        --memory 1Gi \
        --min-replicas 0 \
        --max-replicas 3
    echo "✅ Container App '$WEBAPP_TEST' created"
fi
echo ""

# Get test URL
TEST_URL=$(az containerapp show \
    --name $WEBAPP_TEST \
    --resource-group $RG_TEST \
    --query properties.configuration.ingress.fqdn -o tsv)
echo "🌐 Test URL: https://$TEST_URL"
echo ""

# ==============================================
# PRODUCTION ENVIRONMENT
# ==============================================

echo "================================================"
echo "PRODUCTION ENVIRONMENT SETUP"
echo "================================================"
echo ""

# Create prod resource group
echo "📦 Creating production resource group..."
if az group show --name $RG_PROD &>/dev/null; then
    echo "✅ Resource group '$RG_PROD' already exists"
else
    az group create \
        --name $RG_PROD \
        --location $LOCATION
    echo "✅ Resource group '$RG_PROD' created"
fi
echo ""

# Create prod Container App Environment
echo "🌍 Creating production Container App Environment..."
ENV_PROD="env-exominutes-prod"
if az containerapp env show --name $ENV_PROD --resource-group $RG_PROD &>/dev/null; then
    echo "✅ Container App Environment '$ENV_PROD' already exists"
else
    az containerapp env create \
        --name $ENV_PROD \
        --resource-group $RG_PROD \
        --location $LOCATION
    echo "✅ Container App Environment '$ENV_PROD' created"
fi
echo ""

# Create prod Container App
echo "🚀 Creating production Container App..."
if az containerapp show --name $WEBAPP_PROD --resource-group $RG_PROD &>/dev/null; then
    echo "✅ Container App '$WEBAPP_PROD' already exists"
else
    az containerapp create \
        --name $WEBAPP_PROD \
        --resource-group $RG_PROD \
        --environment $ENV_PROD \
        --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
        --target-port 3000 \
        --ingress external \
        --registry-server ${ACR_NAME}.azurecr.io \
        --cpu 1.0 \
        --memory 2Gi \
        --min-replicas 1 \
        --max-replicas 5
    echo "✅ Container App '$WEBAPP_PROD' created"
fi
echo ""

# Get prod URL
PROD_URL=$(az containerapp show \
    --name $WEBAPP_PROD \
    --resource-group $RG_PROD \
    --query properties.configuration.ingress.fqdn -o tsv)
echo "🌐 Production URL: https://$PROD_URL"
echo ""

# ==============================================
# SERVICE PRINCIPAL (Optional - for GitHub Actions)
# ==============================================

echo "================================================"
echo "SERVICE PRINCIPAL SETUP (Optional)"
echo "================================================"
echo ""
echo "To create a service principal for GitHub Actions:"
echo ""
echo "az ad sp create-for-rbac \\"
echo "  --name \"github-exominutes-webapp-deploy\" \\"
echo "  --role contributor \\"
echo "  --scopes /subscriptions/$SUBSCRIPTION_ID \\"
echo "  --sdk-auth"
echo ""
echo "Copy the JSON output and add it as 'AZURE_CREDENTIALS' secret in GitHub."
echo ""

# ==============================================
# SUMMARY
# ==============================================

echo "================================================"
echo "SETUP COMPLETE! ✨"
echo "================================================"
echo ""
echo "📋 Resources Created:"
echo "   - Test Resource Group: $RG_TEST"
echo "   - Test Container App: $WEBAPP_TEST"
echo "   - Test URL: https://$TEST_URL"
echo ""
echo "   - Prod Resource Group: $RG_PROD"
echo "   - Prod Container App: $WEBAPP_PROD"
echo "   - Prod URL: https://$PROD_URL"
echo ""
echo "📝 Next Steps:"
echo "   1. Create service principal (command above)"
echo "   2. Add AZURE_CREDENTIALS to GitHub secrets"
echo "   3. Add Stripe keys to GitHub secrets"
echo "   4. Configure GitHub environments (test, production)"
echo "   5. Push to main branch to trigger deployment"
echo ""
echo "📖 See DEPLOYMENT_CHECKLIST.md for complete setup guide"
echo ""
