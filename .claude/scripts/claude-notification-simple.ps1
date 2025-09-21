# Simple Claude Notification Script
# Handles both task completion and permission request notifications

param(
    [string]$Message = "Claude has finished the task!",
    [string]$Title = "✅ Claude Done",
    [string]$Sound = "Asterisk",
    [string]$Type = "completion"
)

# Play sound based on type using rundll32 (more reliable)
if ($Type -eq "permission") {
    rundll32 user32.dll,MessageBeep 48  # Question sound
} else {
    switch ($Sound) {
        "Asterisk" { rundll32 user32.dll,MessageBeep 64 }      # Asterisk
        "Beep" { rundll32 user32.dll,MessageBeep 0 }           # Default beep
        "Exclamation" { rundll32 user32.dll,MessageBeep 48 }   # Exclamation
        "Hand" { rundll32 user32.dll,MessageBeep 16 }          # Critical stop
        "Question" { rundll32 user32.dll,MessageBeep 32 }      # Question
        default { rundll32 user32.dll,MessageBeep 64 }         # Default asterisk
    }
}

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
