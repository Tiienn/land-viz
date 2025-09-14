# Test script for permission request notifications
# This script simulates permission request scenarios

Write-Host "Testing Claude permission notification system..." -ForegroundColor Green

# Test 1: Permission request notification
Write-Host "`nTest 1: Permission request notification" -ForegroundColor Yellow
& "C:\Users\Tien\Documents\land-viz\.claude\scripts\claude-notification-advanced.ps1" -Message "Claude is requesting permission! Check Cursor for details." -Title "🔐 Permission Request" -Sound "Question" -Type "permission"

Start-Sleep -Seconds 3

# Test 2: Completion notification
Write-Host "`nTest 2: Task completion notification" -ForegroundColor Yellow
& "C:\Users\Tien\Documents\land-viz\.claude\scripts\claude-notification-advanced.ps1" -Message "Claude has finished the task!" -Title "✅ Claude Done" -Sound "Asterisk" -Type "completion"

Start-Sleep -Seconds 3

# Test 3: Different sounds for permission requests
Write-Host "`nTest 3: Different sounds for permission requests" -ForegroundColor Yellow
$sounds = @("Question", "Exclamation", "Hand")

foreach ($sound in $sounds) {
    Write-Host "Testing permission sound: $sound" -ForegroundColor Cyan
    & "C:\Users\Tien\Documents\land-viz\.claude\scripts\claude-notification-advanced.ps1" -Message "Permission request with $sound sound" -Title "🔐 Permission Test" -Sound $sound -Type "permission"
    Start-Sleep -Seconds 2
}

Write-Host "`nPermission notification test completed!" -ForegroundColor Green
Write-Host "If you saw and heard notifications above, the permission system is working correctly." -ForegroundColor Cyan
Write-Host "`nNote: The Start hook will trigger when Claude begins a task that requires permission." -ForegroundColor Magenta
