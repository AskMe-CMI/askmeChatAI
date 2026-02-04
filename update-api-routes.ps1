# Bulk API Route Update Script
# This script updates all remaining /api/ references to /internal-api/

Write-Host "Starting bulk API route update..." -ForegroundColor Cyan

# Define paths to update
$filesToUpdate = @(
    "components\sidebar-history.tsx",
    "components\chat.tsx",
    "components\artifact.tsx",
    "components\model-selector.tsx",
    "components\document-preview.tsx",
    "components\version-footer.tsx",
    "components\msal-button.tsx",
    "hooks\use-auth.tsx",
    "hooks\use-chat-visibility.ts",
    "middleware.ts"
)

$updateCount = 0
$fileCount = 0

foreach ($file in $filesToUpdate) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $fullPath -Raw
        $originalContent = $content
        
        # Replace '/api/ with '/internal-api/
        $content = $content -replace "'/api/", "'/internal-api/"
        # Replace "/api/ with "/internal-api/
        $content = $content -replace '"/api/', '"/internal-api/'
        # Replace `/api/ with `/internal-api/
        $content = $content -replace '`/api/', '`/internal-api/'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $fullPath -Value $content -NoNewline
            $fileCount++
            $changes = ($originalContent.Length - $content.Replace('/internal-api/', '/api/').Length) / 5
            $updateCount += $changes
            Write-Host "  [OK] Updated $file - $changes replacements" -ForegroundColor Green
        } else {
            Write-Host "  [SKIP] No changes needed in $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "  [ERROR] File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Bulk update complete!" -ForegroundColor Green
Write-Host "Updated $fileCount files with approximately $updateCount replacements" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Test files were not updated. Update them manually if needed." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the changes" -ForegroundColor White
Write-Host "  2. Test the application locally" -ForegroundColor White
Write-Host "  3. Build Docker image: docker compose build" -ForegroundColor White
Write-Host "  4. Run Docker container: docker compose up -d" -ForegroundColor White
