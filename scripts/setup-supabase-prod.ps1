param(
    [string]$ProjectRef = "yfkodcqvuzzaltpwspyw",
    [string]$ProjectUrl = "https://restrowa-os-demo.vercel.app"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "RestroWA OS Supabase production setup" -ForegroundColor Cyan
Write-Host "Project ref: $ProjectRef"
Write-Host ""

$dbPassword = Read-Host "Enter your Supabase database password"

if ([string]::IsNullOrWhiteSpace($dbPassword)) {
    throw "Database password is required."
}

$encodedPassword = [uri]::EscapeDataString($dbPassword)

$runtimeDatabaseUrl = "postgresql://postgres.${ProjectRef}:${encodedPassword}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
$directDatabaseUrl = "postgresql://postgres.${ProjectRef}:${encodedPassword}@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

$env:DATABASE_URL = $directDatabaseUrl
$env:DIRECT_URL = $directDatabaseUrl
$env:SESSION_SECRET = "RestroWA-OS-Demo-Secret-2026-Change"
$env:NEXT_PUBLIC_APP_URL = $ProjectUrl

Write-Host ""
Write-Host "Environment variables prepared." -ForegroundColor Yellow
Write-Host "Direct DB used for migrate/seed: $directDatabaseUrl" -ForegroundColor DarkGray
Write-Host "Runtime pooler URL for Vercel should stay: $runtimeDatabaseUrl" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Running migrations..." -ForegroundColor Yellow

npx.cmd prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    throw "Prisma migrate deploy failed."
}

Write-Host ""
Write-Host "Migrations complete. Running seed..." -ForegroundColor Yellow

npm.cmd run db:seed
if ($LASTEXITCODE -ne 0) {
    throw "Database seed failed."
}

Write-Host ""
Write-Host "Production database setup complete." -ForegroundColor Green
Write-Host "You can now refresh $ProjectUrl" -ForegroundColor Green
