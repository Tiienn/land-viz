# Simple notification that always works
param([string]$msg = "Claude task completed!")

# Method 1: Console output with colors and beep
Write-Host "`n" -NoNewline
Write-Host "🔔🔔🔔 CLAUDE NOTIFICATION 🔔🔔🔔" -ForegroundColor White -BackgroundColor Red
Write-Host "📢 $msg" -ForegroundColor Yellow -BackgroundColor Blue
Write-Host "⏰ $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
Write-Host "🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔" -ForegroundColor White -BackgroundColor Red
Write-Host "`n" -NoNewline

# Method 2: System beep
[Console]::Beep(800, 500)
[Console]::Beep(1000, 300)
[Console]::Beep(1200, 200)

# Method 3: Write to a simple text file
$logFile = ".claude\notifications.txt"
$logDir = Split-Path -Parent $logFile
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
Add-Content -Path $logFile -Value "$(Get-Date -Format 'HH:mm:ss') - $msg"

Write-Host "✅ Notification sent! Check .claude\notifications.txt for log" -ForegroundColor Green
