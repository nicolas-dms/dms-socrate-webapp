# =============================================================
# Push runtime env vars from env/<environment>.env to ACA webapp
# Usage: .\scripts\push_env_to_aca.ps1 -Env test
#        .\scripts\push_env_to_aca.ps1 -Env prod
#
# ⚠️  IMPORTANT — Next.js build-time vs runtime vars:
#     NEXT_PUBLIC_* variables are baked into the client bundle
#     at Docker build time (--build-arg). Pushing them to ACA
#     at runtime has NO effect on the browser bundle.
#     To change NEXT_PUBLIC_* values you must rebuild the image.
#
#     This script pushes only non-NEXT_PUBLIC_ vars (runtime vars
#     readable server-side by Node.js). It prints a summary of
#     NEXT_PUBLIC_* vars found so you know a rebuild may be needed.
# =============================================================

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("test", "prod")]
    [string]$Env
)

$envFile = "env/$Env.env"

if (-not (Test-Path $envFile)) {
    Write-Error "Env file not found: $envFile"
    exit 1
}

# ACA target per environment
$acaConfig = @{
    test = @{ Name = "aca-exominutes-webapp-test"; ResourceGroup = "rg-exominute-test" }
    prod = @{ Name = "aca-exominutes-webapp-prod"; ResourceGroup = "rg-exominute-prod" }
}

$aca = $acaConfig[$Env]

# Parse env file — skip comments and blank lines
$allVars = Get-Content $envFile | Where-Object {
    $_ -notmatch '^\s*#' -and $_ -notmatch '^\s*$'
}

# Split into runtime vs build-time vars
$runtimeVars   = $allVars | Where-Object { $_ -notmatch '^NEXT_PUBLIC_' }
$buildTimeVars = $allVars | Where-Object { $_ -match '^NEXT_PUBLIC_' }

# Report build-time vars (require image rebuild to change)
if ($buildTimeVars.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  The following NEXT_PUBLIC_* vars are baked at build time." -ForegroundColor Yellow
    Write-Host "   They are NOT pushed to ACA — a Docker image rebuild is required to change them:" -ForegroundColor Yellow
    $buildTimeVars | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkYellow }
    Write-Host ""
}

if ($runtimeVars.Count -eq 0) {
    Write-Host "ℹ️  No runtime (server-side) env vars to push for '$Env'." -ForegroundColor Cyan
    exit 0
}

Write-Host "🚀 Pushing $($runtimeVars.Count) runtime env var(s) to ACA '$($aca.Name)'..." -ForegroundColor Cyan

az containerapp update `
    --name $aca.Name `
    --resource-group $aca.ResourceGroup `
    --set-env-vars @runtimeVars `
    --query "properties.latestRevisionName" --output tsv

Write-Host "✅ Done." -ForegroundColor Green
