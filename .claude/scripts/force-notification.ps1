# Force Notification Script - Bypasses Windows notification restrictions
# This script uses multiple methods to ensure you see the notification

param(
    [string]$Message = "Claude task completed!",
    [string]$Title = "✅ Claude Done",
    [string]$Sound = "Asterisk"
)

Write-Host "=== CLAUDE NOTIFICATION ===" -ForegroundColor Green
Write-Host "Title: $Title" -ForegroundColor Yellow
Write-Host "Message: $Message" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Green

# Method 1: Console beep and text
Write-Host "`a" -NoNewline  # Bell character
Write-Host "🔔 NOTIFICATION: $Message" -ForegroundColor Cyan -BackgroundColor DarkBlue

# Method 2: System sound
try {
    switch ($Sound) {
        "Asterisk" { [System.Media.SystemSounds]::Asterisk.Play() }
        "Beep" { [System.Media.SystemSounds]::Beep.Play() }
        "Exclamation" { [System.Media.SystemSounds]::Exclamation.Play() }
        "Hand" { [System.Media.SystemSounds]::Hand.Play() }
        "Question" { [System.Media.SystemSounds]::Question.Play() }
        default { [System.Media.SystemSounds]::Asterisk.Play() }
    }
} catch {
    Write-Host "Sound failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 3: Multiple MessageBox attempts
try {
    Add-Type -AssemblyName System.Windows.Forms
    
    # Try different MessageBox styles
    $result1 = [System.Windows.Forms.MessageBox]::Show($Message, $Title, 'OK', 'Information')
    Write-Host "MessageBox shown successfully" -ForegroundColor Green
    
} catch {
    Write-Host "MessageBox failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Fallback: Create custom form
    try {
        $form = New-Object System.Windows.Forms.Form
        $form.Text = $Title
        $form.Size = New-Object System.Drawing.Size(400, 150)
        $form.StartPosition = 'CenterScreen'
        $form.TopMost = $true
        $form.FormBorderStyle = 'FixedDialog'
        $form.MaximizeBox = $false
        $form.MinimizeBox = $false
        
        $label = New-Object System.Windows.Forms.Label
        $label.Text = $Message
        $label.AutoSize = $true
        $label.Location = New-Object System.Drawing.Point(20, 30)
        $label.Font = New-Object System.Drawing.Font("Segoe UI", 10)
        
        $form.Controls.Add($label)
        $form.ShowDialog()
        Write-Host "Custom form shown successfully" -ForegroundColor Green
        
    } catch {
        Write-Host "Custom form failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Method 4: Toast notification (Windows 10/11)
try {
    # Create a simple toast using PowerShell
    $toast = @"
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]::CreateToastNotifier("Claude Assistant").Show(
    [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
)
"@
    Invoke-Expression $toast
    Write-Host "Toast notification sent" -ForegroundColor Green
} catch {
    Write-Host "Toast notification failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 5: Write to a notification file that you can monitor
$notificationFile = ".claude\logs\last-notification.txt"
$notificationDir = Split-Path -Parent $notificationFile

if (-not (Test-Path $notificationDir)) {
    New-Item -ItemType Directory -Path $notificationDir -Force | Out-Null
}

$notificationContent = @"
=== CLAUDE NOTIFICATION ===
Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Title: $Title
Message: $Message
===========================
"@

Set-Content -Path $notificationFile -Value $notificationContent
Write-Host "Notification written to: $notificationFile" -ForegroundColor Cyan

Write-Host "`n🔔 NOTIFICATION COMPLETE - Check for popup windows!" -ForegroundColor Green -BackgroundColor DarkGreen
