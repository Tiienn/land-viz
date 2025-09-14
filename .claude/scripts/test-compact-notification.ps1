# Test script for compact mode notifications
# This script tests the compact notification system

Write-Host "Testing Claude compact notification system..." -ForegroundColor Green

# Test 1: Basic compact notification
Write-Host "`nTest 1: Basic compact notification" -ForegroundColor Yellow
& "C:\Users\Tien\Documents\land-viz\.claude\scripts\compact-notification.ps1" -Message "Compact mode operation completed!" -Title "📱 Compact Done" -Sound "Beep" -Operation "toggle"

Start-Sleep -Seconds 3

# Test 2: Different compact operations
Write-Host "`nTest 2: Different compact operations" -ForegroundColor Yellow
$operations = @("toggle", "expand", "collapse", "minimize", "maximize")

foreach ($operation in $operations) {
    Write-Host "Testing compact operation: $operation" -ForegroundColor Cyan
    & "C:\Users\Tien\Documents\land-viz\.claude\scripts\compact-notification.ps1" -Message "Compact $operation operation completed!" -Title "📱 Compact $operation" -Sound "Beep" -Operation $operation
    Start-Sleep -Seconds 2
}

# Test 3: Different sounds for compact operations
Write-Host "`nTest 3: Different sounds for compact operations" -ForegroundColor Yellow
$sounds = @("Beep", "Asterisk", "Exclamation")

foreach ($sound in $sounds) {
    Write-Host "Testing compact sound: $sound" -ForegroundColor Cyan
    & "C:\Users\Tien\Documents\land-viz\.claude\scripts\compact-notification.ps1" -Message "Compact operation with $sound sound" -Title "📱 Compact Test" -Sound $sound -Operation "toggle"
    Start-Sleep -Seconds 2
}

Write-Host "`nCompact notification test completed!" -ForegroundColor Green
Write-Host "If you saw and heard notifications above, the compact system is working correctly." -ForegroundColor Cyan
Write-Host "`nNote: The ToolUse hook will trigger when Claude performs compact-related operations." -ForegroundColor Magenta