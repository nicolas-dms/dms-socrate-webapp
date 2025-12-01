# 📋 Deployment Setup Checklist

Complete this checklist before deploying the ExoMinutes WebApp to Azure.

## ✅ Azure Resources

- [ ] **Container Registry Created**
  - Name: `exominutesacr`
  - Login server: `exominutesacr.azurecr.io`
  - Location: France Central (or your preferred region)

- [ ] **Test Environment Resources**
  - [ ] Resource group: `rg-exominute-test`
  - [ ] Container App: `aca-exominutes-webapp-test`
  - [ ] Container App configured with:
    - [ ] Ingress enabled (port 3000)
    - [ ] External ingress traffic
    - [ ] HTTPS enabled
    - [ ] Managed identity or ACR pull credentials configured

- [ ] **Production Environment Resources**
  - [ ] Resource group: `rg-exominute-prod`
  - [ ] Container App: `aca-exominutes-webapp-prod`
  - [ ] Container App configured with:
    - [ ] Ingress enabled (port 3000)
    - [ ] External ingress traffic
    - [ ] HTTPS enabled
    - [ ] Managed identity or ACR pull credentials configured

## 🔐 Azure Service Principal

- [ ] **Service Principal Created**
  ```bash
  az ad sp create-for-rbac \
    --name "github-exominutes-webapp-deploy" \
    --role contributor \
    --scopes /subscriptions/dc247650-4ab3-4b8e-bec7-2286ecf3ff7c \
    --sdk-auth
  ```

- [ ] **Service Principal has permissions for:**
  - [ ] ACR push/pull
  - [ ] Container App updates
  - [ ] Resource group read access

## 🔑 GitHub Secrets Configuration

Navigate to: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

### Required Secrets

- [ ] **`AZURE_CREDENTIALS`**
  - Value: JSON output from service principal creation
  - Format:
    ```json
    {
      "clientId": "...",
      "clientSecret": "...",
      "subscriptionId": "dc247650-4ab3-4b8e-bec7-2286ecf3ff7c",
      "tenantId": "..."
    }
    ```

- [ ] **`STRIPE_PUBLISHABLE_KEY_TEST`**
  - Value: `pk_test_...`
  - Used for test environment builds

- [ ] **`STRIPE_PUBLISHABLE_KEY_PROD`**
  - Value: `pk_live_...` (or `pk_test_...` for testing)
  - Used for production environment builds

## 🌍 GitHub Environments Configuration

Navigate to: **GitHub Repository** → **Settings** → **Environments**

### Test Environment

- [ ] **Environment created**: `test`
- [ ] **Protection rules**: None (auto-deploy)
- [ ] **Secrets**: Inherits from repository

### Production Environment

- [ ] **Environment created**: `production`
- [ ] **Protection rules configured**:
  - [ ] ✅ Required reviewers (minimum 1)
  - [ ] Reviewers added: `[Your GitHub username(s)]`
  - [ ] Optional: Wait timer (e.g., 5 minutes)
- [ ] **Secrets**: Inherits from repository

## 📦 Repository Configuration

- [ ] **Files committed to repository**:
  - [ ] `Dockerfile`
  - [ ] `.dockerignore`
  - [ ] `.github/workflows/deploy.yml`
  - [ ] `next.config.ts` (with `output: 'standalone'`)
  - [ ] `DEPLOYMENT.md`
  - [ ] `DEPLOYMENT_QUICK_REF.md`

- [ ] **Environment Variables Updated in Workflow**:
  - [ ] Test API URL in workflow (line ~57)
  - [ ] Production API URL in workflow (line ~122)
  - [ ] Container App names match your Azure resources
  - [ ] Resource group names match your Azure resources

## 🧪 Local Testing

- [ ] **Docker installed and running**

- [ ] **Test local build**:
  ```bash
  # Windows
  scripts\build-docker-local.bat
  
  # Linux/Mac
  ./scripts/build-docker-local.sh
  ```

- [ ] **Test local container**:
  ```bash
  docker run -p 3000:3000 exominutes-webapp:local-test
  ```

- [ ] **Verify app runs**: `http://localhost:3000`

- [ ] **Clean up**:
  ```bash
  docker rmi exominutes-webapp:local-test
  ```

## 🚀 First Deployment

- [ ] **Commit and push to main**:
  ```bash
  git add .
  git commit -m "feat: add deployment workflow"
  git push origin main
  ```

- [ ] **Monitor GitHub Actions**:
  - [ ] Go to **Actions** tab
  - [ ] Watch "Build and Deploy WebApp" workflow
  - [ ] Verify build phase completes
  - [ ] Verify test deployment succeeds

- [ ] **Verify Test Deployment**:
  - [ ] Access test URL
  - [ ] Check app loads correctly
  - [ ] Verify API connection works
  - [ ] Test authentication flow

- [ ] **Approve Production Deployment**:
  - [ ] Go to Actions → Workflow run
  - [ ] Review changes
  - [ ] Click "Review deployments"
  - [ ] Approve production deployment

- [ ] **Verify Production Deployment**:
  - [ ] Access production URL
  - [ ] Check app loads correctly
  - [ ] Verify API connection works
  - [ ] Test authentication flow

## 📊 Post-Deployment Verification

### Test Environment

```bash
# Get URL
az containerapp show \
  --name aca-exominutes-webapp-test \
  --resource-group rg-exominute-test \
  --query properties.configuration.ingress.fqdn -o tsv

# Check status
az containerapp show \
  --name aca-exominutes-webapp-test \
  --resource-group rg-exominute-test \
  --query properties.runningStatus
```

- [ ] URL accessible: ___________________________________
- [ ] Status: Running
- [ ] No errors in logs

### Production Environment

```bash
# Get URL
az containerapp show \
  --name aca-exominutes-webapp-prod \
  --resource-group rg-exominute-prod \
  --query properties.configuration.ingress.fqdn -o tsv

# Check status
az containerapp show \
  --name aca-exominutes-webapp-prod \
  --resource-group rg-exominute-prod \
  --query properties.runningStatus
```

- [ ] URL accessible: ___________________________________
- [ ] Status: Running
- [ ] No errors in logs

## 🔍 Container Registry Verification

```bash
# Login to ACR
az acr login --name exominutesacr

# List repositories
az acr repository list --name exominutesacr

# List webapp tags
az acr repository show-tags \
  --name exominutesacr \
  --repository exominutes-webapp
```

- [ ] Repository `exominutes-webapp` exists
- [ ] Tags visible: `test`, `prod`, and versioned tags
- [ ] Images pushed successfully

## 📝 Documentation

- [ ] **Team informed about**:
  - [ ] Deployment process
  - [ ] How to approve production deployments
  - [ ] Rollback procedure
  - [ ] Where to find logs

- [ ] **URLs documented**:
  - [ ] Test environment URL: ___________________________________
  - [ ] Production environment URL: ___________________________________
  - [ ] Backend API test URL: ___________________________________
  - [ ] Backend API prod URL: ___________________________________

## 🎯 Next Steps

After initial deployment:

- [ ] Set up monitoring/alerts in Azure
- [ ] Configure custom domain (if needed)
- [ ] Set up SSL certificates (if using custom domain)
- [ ] Configure scaling rules
- [ ] Set up log analytics workspace
- [ ] Document rollback procedures for team

## ⚠️ Important Notes

1. **Environment Variables**: `NEXT_PUBLIC_*` variables are embedded at **build time**, not runtime
2. **Image Size**: First build will take 3-5 minutes due to npm dependencies
3. **Revisions**: Container App keeps last 10 revisions by default
4. **Costs**: Container Apps charge for vCPU and memory usage
5. **Security**: Never commit `.env.local` or secrets to repository

## 🆘 Troubleshooting

If anything fails, check:

1. **GitHub Actions logs** for detailed error messages
2. **Azure Container App logs**: 
   ```bash
   az containerapp logs show --name <app-name> --resource-group <rg-name> --follow
   ```
3. **Service Principal permissions**:
   ```bash
   az role assignment list --assignee <client-id>
   ```
4. **ACR credentials**:
   ```bash
   az acr check-health --name exominutesacr
   ```

---

## ✨ Deployment Complete!

Once all items are checked, your deployment pipeline is ready! 

Push to `main` to trigger automatic deployment to test, then approve for production.

**Last updated**: _________________  
**Completed by**: _________________
