# 🔧 Fix: Azure Login Authentication Error

## Problem

GitHub Actions is failing with:
```
Error: Login failed with Error: Using auth-type: SERVICE_PRINCIPAL. 
Not all values are present. Ensure 'client-id' and 'tenant-id' are supplied.
```

## Root Cause

The `AZURE_CREDENTIALS` secret format needs to match what `azure/login@v2` expects.

---

## Solution: Update AZURE_CREDENTIALS Secret

### Step 1: Create Service Principal (if not already done)

```bash
az ad sp create-for-rbac \
  --name "github-exominutes-webapp-deploy" \
  --role contributor \
  --scopes /subscriptions/dc247650-4ab3-4b8e-bec7-2286ecf3ff7c \
  --json-auth
```

**Important:** Use `--json-auth` (not `--sdk-auth`)

### Step 2: Verify JSON Output Format

The output should look like this:

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "your-secret-here",
  "subscriptionId": "dc247650-4ab3-4b8e-bec7-2286ecf3ff7c",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Check that ALL four fields are present:**
- ✅ `clientId`
- ✅ `clientSecret`
- ✅ `subscriptionId`
- ✅ `tenantId`

### Step 3: Update GitHub Secret

1. Go to: **GitHub Repository → Settings → Secrets and variables → Actions**
2. Find `AZURE_CREDENTIALS` secret
3. Click **Update**
4. **Paste the ENTIRE JSON** from Step 1 (including the curly braces)
5. Click **Update secret**

---

## Alternative: Use Existing Service Principal

If you already have a service principal, get the credentials:

```bash
# Get the app ID (client ID)
az ad sp list --display-name "github-exominutes-webapp-deploy" --query "[0].appId" -o tsv

# Get the tenant ID
az account show --query tenantId -o tsv

# Get subscription ID
az account show --query id -o tsv
```

Then **manually create the JSON**:

```json
{
  "clientId": "<app-id-from-step-1>",
  "clientSecret": "<your-original-secret>",
  "subscriptionId": "dc247650-4ab3-4b8e-bec7-2286ecf3ff7c",
  "tenantId": "<tenant-id-from-step-2>"
}
```

⚠️ **Note:** If you don't have the original `clientSecret`, you'll need to create a new one:

```bash
# Get the service principal object ID
SP_ID=$(az ad sp list --display-name "github-exominutes-webapp-deploy" --query "[0].id" -o tsv)

# Create new credential
az ad sp credential reset --id $SP_ID --query '{clientId:appId, clientSecret:password, tenantId:tenant}' -o json
```

---

## Verify the Fix

After updating the secret, try the workflow again:

1. Go to **Actions** tab in GitHub
2. Click on the failed workflow run
3. Click **Re-run all jobs**

OR push a new commit:

```bash
git commit --allow-empty -m "test: trigger deployment"
git push
```

---

## Common Mistakes

### ❌ Wrong: Using old --sdk-auth format
```bash
az ad sp create-for-rbac --sdk-auth  # Don't use this!
```

The `--sdk-auth` flag is deprecated and creates a different JSON structure.

### ❌ Wrong: Missing fields
```json
{
  "clientId": "xxx",
  "clientSecret": "xxx"
  // Missing subscriptionId and tenantId!
}
```

### ❌ Wrong: Not JSON format
```
clientId=xxx
clientSecret=xxx
```

Secrets must be valid JSON!

### ✅ Correct: All fields present
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "your-secret-here",
  "subscriptionId": "dc247650-4ab3-4b8e-bec7-2286ecf3ff7c",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

---

## Test Azure Authentication Locally

You can test the service principal works:

```bash
# Login with service principal
az login --service-principal \
  --username <clientId> \
  --password <clientSecret> \
  --tenant <tenantId>

# Test ACR access
az acr login --name exominutesacr

# Test Container App access
az containerapp show \
  --name aca-exominutes-webapp-test \
  --resource-group rg-exominute-test
```

If these commands work, the credentials are valid!

---

## Still Having Issues?

### Check Service Principal Permissions

```bash
# List role assignments for the service principal
az role assignment list \
  --assignee <clientId> \
  --output table
```

Should show **Contributor** role on your subscription.

### Check Secret in GitHub

1. Go to **Settings → Secrets and variables → Actions**
2. You should see `AZURE_CREDENTIALS` with a green checkmark
3. The value should show "Updated X hours/days ago"

### Check Workflow File

Verify all three Azure Login steps use `v2`:

```yaml
- name: Azure Login
  uses: azure/login@v2  # ✅ Must be v2
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}
```

---

## Quick Fix Checklist

- [ ] Create service principal with `--json-auth`
- [ ] Verify JSON has all 4 fields (clientId, clientSecret, subscriptionId, tenantId)
- [ ] Update `AZURE_CREDENTIALS` secret in GitHub
- [ ] Paste entire JSON (with curly braces)
- [ ] Re-run workflow
- [ ] ✅ Workflow succeeds!

---

**Need Help?**

If still failing, check:
1. GitHub Actions logs for exact error message
2. Verify service principal exists: `az ad sp list --display-name "github-exominutes-webapp-deploy"`
3. Verify permissions: `az role assignment list --assignee <clientId>`
