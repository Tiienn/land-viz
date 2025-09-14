# Advanced Claude Notification Script
# Handles both task completion and permission request notifications

param(
    [string]$Message = "Claude has finished the task!",
    [string]$Title = "✅ Claude Done",
    [string]$Sound = "Asterisk",
    [string]$Type = "completion",  # "completion" or "permission"
    [string]$ConfigPath = "C:\Users\Tien\Documents\land-viz\.claude\settings.local.json"
)

# Function to check for permission requests
function Check-PermissionRequests {
    try {
        if (Test-Path $ConfigPath) {
            $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
            
            # Check if there are items in the "ask" array
            if ($config.permissions -and $config.permissions.ask -and $config.permissions.ask.Count -gt 0) {
                return $true
            }
        }
        return $false
    } catch {
        return $false
    }
}

# Function to play sound based on type
function Play-NotificationSound {
    param([string]$SoundType, [string]$SoundName)
    
    if ($SoundType -eq "permission") {
        # Use Question sound for permission requests
        [System.Media.SystemSounds]::Question.Play()
    } else {
        # Use specified sound for completions
        switch ($SoundName) {
            "Asterisk" { [System.Media.SystemSounds]::Asterisk.Play() }
            "Beep" { [System.Media.SystemSounds]::Beep.Play() }
            "Exclamation" { [System.Media.SystemSounds]::Exclamation.Play() }
            "Hand" { [System.Media.SystemSounds]::Hand.Play() }
            "Question" { [System.Media.SystemSounds]::Question.Play() }
            default { [System.Media.SystemSounds]::Asterisk.Play() }
        }
    }
}

# Function to show notification
function Show-Notification {
    param([string]$Message, [string]$Title, [string]$Type)
    
    # Play sound
    Play-NotificationSound -SoundType $Type -SoundName $Sound
    
    # Show notification dialog
    Add-Type -AssemblyName System.Windows.Forms
    $icon = if ($Type -eq "permission") { "Warning" } else { "Information" }
    [System.Windows.Forms.MessageBox]::Show($Message, $Title, 'OK', $icon)
    
    # Show toast notification
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        
        $form = New-Object System.Windows.Forms.Form
        $form.Text = $Title
        $form.Size = New-Object System.Drawing.Size(400, 120)
        $form.StartPosition = 'Manual'
        $form.Location = New-Object System.Drawing.Point([System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Width - 420, [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Height - 140)
        $form.TopMost = $true
        $form.FormBorderStyle = 'FixedDialog'
        $form.MaximizeBox = $false
        $form.MinimizeBox = $false
        $form.ShowInTaskbar = $false
        
        # Set background color based on type
        if ($Type -eq "permission") {
            $form.BackColor = [System.Drawing.Color]::Orange
        } else {
            $form.BackColor = [System.Drawing.Color]::LightGreen
        }
        
        $label = New-Object System.Windows.Forms.Label
        $label.Text = $Message
        $label.AutoSize = $true
        $label.Location = New-Object System.Drawing.Point(10, 20)
        $label.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
        
        if ($Type -eq "permission") {
            $label.ForeColor = [System.Drawing.Color]::DarkRed
        } else {
            $label.ForeColor = [System.Drawing.Color]::DarkGreen
        }
        
        $form.Controls.Add($label)
        $form.Show()
        
        # Auto-close after specified seconds
        $closeTime = if ($Type -eq "permission") { 5000 } else { 3000 }
        $timer = New-Object System.Windows.Forms.Timer
        $timer.Interval = $closeTime
        $timer.Add_Tick({
            $form.Close()
            $timer.Stop()
        })
        $timer.Start()
    } catch {
        Write-Host "Notification shown: $Title - $Message"
    }
}

# Main execution
if ($Type -eq "permission") {
    # Check if there are actual permission requests
    if (Check-PermissionRequests) {
        Show-Notification -Message "Claude is requesting permission! Check Cursor for details." -Title "🔐 Permission Request" -Type "permission"
    } else {
        Write-Host "No permission requests detected."
    }
} else {
    # Show completion notification
    Show-Notification -Message $Message -Title $Title -Type "completion"
}