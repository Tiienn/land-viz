# Test script for Claude notification system
# Run this to test if notifications work properly

Write-Host "Testing Claude notification system..." -ForegroundColor Green

# Test different notification sounds
$sounds = @("Asterisk", "Beep", "Exclamation", "Hand", "Question")

foreach ($sound in $sounds) {
    Write-Host "Testing sound: $sound" -ForegroundColor Yellow
    & "C:\Users\Tien\Documents\land-viz\.claude\scripts\claude-notification.ps1" -Message "Test notification with $sound sound" -Title "🔔 Test Notification" -Sound $sound
    Start-Sleep -Seconds 2
}

Write-Host "Notification test completed!" -ForegroundColor Green
Write-Host "If you saw and heard notifications above, the system is working correctly." -ForegroundColor Cyan
