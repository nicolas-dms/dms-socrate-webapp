# 🚀 Quick Start - Deployment Setup

**Complete this in 15 minutes!**

---

## Step 1: Verify Prerequisites (2 min)

```bash
# Check Azure CLI
az --version

# Check Docker
docker --version

# Login to Azure
az login
az account set --subscription dc247650-4ab3-4b8e-bec7-2286ecf3ff7c
```

✅ Azure CLI installed  
✅ Docker installed  
✅ Logged into Azure

---

## Step 2: Create Azure Resources (5 min)

### Option A: Automated (Recommended)
```bash
./scripts/setup-azure-resources.sh
```

### Option B: Manual
See `DEPLOYMENT_CHECKLIST.md` section "Azure Resources"

**Result:** Test and prod Container Apps created ✅

---

## Step 3: Create Service Principal (2 min)

```bash
az ad sp create-for-rbac \
  --name "github-exominutes-webapp-deploy" \
  --role contributor \
  --scopes /subscriptions/dc247650-4ab3-4b8e-bec7-2286ecf3ff7c \
  --sdk-auth
```

**Copy the entire JSON output** ⚠️

---

## Step 4: Configure GitHub Secrets (3 min)

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

Add these 3 secrets:

| Name | Value |
|------|-------|
| `AZURE_CREDENTIALS` | Paste JSON from Step 3 |
| `STRIPE_PUBLISHABLE_KEY_TEST` | Your Stripe test key |
| `STRIPE_PUBLISHABLE_KEY_PROD` | Your Stripe prod key |

✅ All 3 secrets added

---

## Step 5: Configure GitHub Environments (2 min)

Go to: **GitHub Repo → Settings → Environments**

### Create "test" environment:
- Click "New environment"
- Name: `test`
- Don't add any protection rules
- Save

### Create "production" environment:
- Click "New environment"  
- Name: `production`
- ✅ Check "Required reviewers"
- Add yourself as reviewer
- Save

✅ Both environments created

---

## Step 6: Test Locally (Optional, 2 min)

```bash
# Windows
scripts\build-docker-local.bat

# Linux/Mac  
./scripts/build-docker-local.sh

# Run container
docker run -p 3000:3000 exominutes-webapp:local-test

# Test in browser
# http://localhost:3000

# Clean up
docker rmi exominutes-webapp:local-test
```

✅ Local build works (optional)

---

## Step 7: Deploy! (1 min)

```bash
git add .
git commit -m "feat: add deployment pipeline"
git push origin main
```

Then:

1. **Go to GitHub → Actions tab**
2. **Watch the workflow run** (takes ~5 minutes)
3. **Test deployment completes automatically**
4. **Click "Review deployments" when prompted**
5. **Approve production deployment**

✅ Deployed to test ✅  
✅ Deployed to production ✅

---

## Step 8: Verify (1 min)

```bash
# Get test URL
az containerapp show \
  --name aca-exominutes-webapp-test \
  --resource-group rg-exominute-test \
  --query properties.configuration.ingress.fqdn -o tsv

# Get prod URL
az containerapp show \
  --name aca-exominutes-webapp-prod \
  --resource-group rg-exominute-prod \
  --query properties.configuration.ingress.fqdn -o tsv
```

**Visit both URLs and test!**

✅ Test working  
✅ Production working

---

## 🎉 You're Done!

Your deployment pipeline is now active!

### Next Time You Deploy:

Just push to main:
```bash
git add .
git commit -m "your message"
git push
```

Test auto-deploys → Approve in GitHub → Production deploys ✨

---

## 📚 Need More Help?

- **Full Guide**: `DEPLOYMENT.md`
- **Commands**: `DEPLOYMENT_QUICK_REF.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Troubleshooting**: See `DEPLOYMENT.md` → Troubleshooting section

---

## 🔧 Common Issues

### "Image not found" error
```bash
# Grant Container App access to ACR
az containerapp registry set \
  --name aca-exominutes-webapp-test \
  --resource-group rg-exominute-test \
  --server exominutesacr.azurecr.io
```

### "Unauthorized" error in GitHub Actions
- Check `AZURE_CREDENTIALS` secret is correct JSON
- Verify service principal has Contributor role

### Build fails
- Check `package.json` and `package-lock.json` are committed
- Verify Node version in Dockerfile matches your project

---

**Time to Complete**: ~15 minutes  
**Difficulty**: Easy  
**Prerequisites**: Azure CLI, Docker, GitHub access

Happy deploying! 🚀
