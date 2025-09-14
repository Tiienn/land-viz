# Monitor for Claude notifications
# This script watches for notification files and displays them

$notificationFile = ".claude\logs\last-notification.txt"
$lastContent = ""

Write-Host "🔍 Monitoring Claude notifications..." -ForegroundColor Green
Write-Host "Watching: $notificationFile" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    if (Test-Path $notificationFile) {
        $currentContent = Get-Content $notificationFile -Raw
        
        if ($currentContent -ne $lastContent -and $currentContent) {
            Write-Host "`n🔔 NEW NOTIFICATION DETECTED!" -ForegroundColor Green -BackgroundColor DarkBlue
            Write-Host $currentContent -ForegroundColor White
            Write-Host "`n" + "="*50 -ForegroundColor Green
            $lastContent = $currentContent
        }
    }
    
    Start-Sleep -Seconds 1
}
