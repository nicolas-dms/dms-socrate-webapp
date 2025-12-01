# Deployment Guide - ExoMinutes WebApp

This guide explains how to deploy the ExoMinutes frontend webapp to Azure Container Apps using GitHub Actions.

## 🏗️ Architecture Overview

The deployment pipeline follows a **test-first, approval-gated production** strategy:

```
main branch push
    ↓
[BUILD] → Docker image with versioned tags
    ↓
[TEST] → Auto-deploy to test environment
    ↓
[APPROVAL] → Manual approval required
    ↓
[PROD] → Deploy to production environment
```

## 📦 Prerequisites

### 1. Azure Resources

You need the following Azure resources created:

- **Container Registry**: `exominutesacr.azurecr.io`
- **Resource Groups**:
  - `rg-exominute-test` (Test environment)
  - `rg-exominute-prod` (Production environment)
- **Container Apps**:
  - `aca-exominutes-webapp-test`
  - `aca-exominutes-webapp-prod`

### 2. GitHub Secrets

Configure the following secrets in your GitHub repository:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AZURE_CREDENTIALS` | Azure service principal credentials | JSON object with clientId, clientSecret, subscriptionId, tenantId |
| `STRIPE_PUBLISHABLE_KEY_TEST` | Stripe test publishable key | `pk_test_...` |
| `STRIPE_PUBLISHABLE_KEY_PROD` | Stripe production publishable key | `pk_live_...` |

#### Creating AZURE_CREDENTIALS

```bash
az ad sp create-for-rbac \
  --name "github-exominutes-webapp-deploy" \
  --role contributor \
  --scopes /subscriptions/dc247650-4ab3-4b8e-bec7-2286ecf3ff7c \
  --sdk-auth
```

Copy the JSON output and add it as `AZURE_CREDENTIALS` secret in GitHub.

### 3. GitHub Environments

Create two environments in your GitHub repository settings:

- **test**: No protection rules (auto-deploy)
- **production**: Add protection rules:
  - ✅ Required reviewers (at least 1)
  - ✅ Wait timer (optional)

## 🚀 Deployment Workflow

### Automatic Deployment to Test

When you push to `main` branch:

1. **Build Phase**:
   - Creates Docker image with test configuration
   - Tags: `YYYYMMDD-HHMM-SHORTSHA` and `test`
   - Pushes to ACR

2. **Test Deployment**:
   - Automatically deploys to `aca-exominutes-webapp-test`
   - Uses test API URL: `https://aca-exominutes-api-test.kindocean-d336a5c4.francecentral.azurecontainerapps.io`
   - Creates readable revision: `webapp-20251201-1545-abc1234`

### Manual Deployment to Production

After test deployment succeeds:

1. **Approval**:
   - GitHub stops at the production environment
   - Reviewer(s) must approve the deployment

2. **Production Build**:
   - Rebuilds image with production configuration
   - Uses production API URL
   - Uses production Stripe keys

3. **Production Deployment**:
   - Deploys to `aca-exominutes-webapp-prod`
   - Same revision naming for traceability

## 🔧 Configuration

### Environment Variables

The following variables are **embedded at build time**:

| Variable | Test Value | Prod Value |
|----------|-----------|------------|
| `NEXT_PUBLIC_API_URL` | `https://aca-exominutes-api-test...` | `https://aca-exominutes-api-prod...` |
| `NEXT_PUBLIC_ENVIRONMENT` | `test` | `production` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | From secret `STRIPE_PUBLISHABLE_KEY_TEST` | From secret `STRIPE_PUBLISHABLE_KEY_PROD` |

### Updating API URLs

To change the backend API URLs, edit `.github/workflows/deploy.yml`:

```yaml
# For test environment (line ~57)
--build-arg NEXT_PUBLIC_API_URL=https://your-new-test-api-url

# For production environment (line ~122)
--build-arg NEXT_PUBLIC_API_URL=https://your-new-prod-api-url
```

## 📋 Manual Deployment

To trigger a deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **"Build and Deploy WebApp"** workflow
3. Click **"Run workflow"**
4. Select `main` branch
5. Click **"Run workflow"** button

## 🐛 Troubleshooting

### Build Fails

**Check:**
- Dockerfile syntax
- Node version compatibility (requires Node 20)
- Build arguments are correctly passed

**View logs:**
```bash
# Check GitHub Actions logs for detailed error messages
```

### Deployment Fails

**Check:**
- Azure Container App exists: `az containerapp show --name aca-exominutes-webapp-test --resource-group rg-exominute-test`
- ACR credentials are valid: `az acr login --name exominutesacr`
- Service principal has proper permissions

### Image Not Found

**Verify image in ACR:**
```bash
az acr repository list --name exominutesacr --output table
az acr repository show-tags --name exominutesacr --repository exominutes-webapp --output table
```

### Environment Variables Not Working

**Remember:** 
- `NEXT_PUBLIC_*` variables are **build-time only**
- Changes require a **new build**, not just redeployment
- Check that variables are passed via `--build-arg` in workflow

## 🔍 Verification

After deployment, verify:

### Test Environment
```bash
# Get test URL
az containerapp show \
  --name aca-exominutes-webapp-test \
  --resource-group rg-exominute-test \
  --query properties.configuration.ingress.fqdn -o tsv

# Check revision
az containerapp revision list \
  --name aca-exominutes-webapp-test \
  --resource-group rg-exominute-test \
  --output table
```

### Production Environment
```bash
# Get prod URL
az containerapp show \
  --name aca-exominutes-webapp-prod \
  --resource-group rg-exominute-prod \
  --query properties.configuration.ingress.fqdn -o tsv

# Check revision
az containerapp revision list \
  --name aca-exominutes-webapp-prod \
  --resource-group rg-exominute-prod \
  --output table
```

## 📊 Revision Management

Container App revisions use human-readable names:
- Format: `webapp-YYYYMMDD-HHMM-SHORTSHA`
- Example: `webapp-20251201-1545-abc1234`

**Benefits:**
- Easy to identify when code was deployed
- Git commit SHA for exact code traceability
- Supports blue-green deployments and rollbacks

## 🔄 Rollback Procedure

If production deployment has issues:

1. **Via Azure Portal**:
   - Go to Container App → Revisions
   - Select previous working revision
   - Click "Activate"

2. **Via Azure CLI**:
```bash
# List revisions
az containerapp revision list \
  --name aca-exominutes-webapp-prod \
  --resource-group rg-exominute-prod \
  --output table

# Activate previous revision
az containerapp revision activate \
  --name aca-exominutes-webapp-prod \
  --resource-group rg-exominute-prod \
  --revision <revision-name>
```

## 📝 Notes

- **Test and Prod use different builds**: This ensures environment-specific configurations are properly embedded
- **No runtime environment variables**: All `NEXT_PUBLIC_*` vars are embedded at build time
- **Image tags**: Each environment uses its own tag (`test`, `prod`) for easier management
- **Approval required**: Production deployments require manual approval for safety

## 🔗 Related Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
