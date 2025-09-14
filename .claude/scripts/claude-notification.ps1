# Claude Task Completion Notification Script
# This script provides customizable notifications when Claude finishes tasks

param(
    [string]$Message = "Claude has finished the task!",
    [string]$Title = "✅ Claude Done",
    [string]$Sound = "Asterisk"  # Options: Asterisk, Beep, Exclamation, Hand, Question
)

# Play system sound
switch ($Sound) {
    "Asterisk" { [System.Media.SystemSounds]::Asterisk.Play() }
    "Beep" { [System.Media.SystemSounds]::Beep.Play() }
    "Exclamation" { [System.Media.SystemSounds]::Exclamation.Play() }
    "Hand" { [System.Media.SystemSounds]::Hand.Play() }
    "Question" { [System.Media.SystemSounds]::Question.Play() }
    default { [System.Media.SystemSounds]::Asterisk.Play() }
}

# Show notification dialog
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show($Message, $Title, 'OK', 'Information')

# Optional: Also show a toast notification (Windows 10/11)
try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    
    # Create a custom notification form
    $form = New-Object System.Windows.Forms.Form
    $form.Text = $Title
    $form.Size = New-Object System.Drawing.Size(350, 100)
    $form.StartPosition = 'Manual'
    $form.Location = New-Object System.Drawing.Point([System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Width - 370, [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Height - 120)
    $form.TopMost = $true
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.ShowInTaskbar = $false
    
    $label = New-Object System.Windows.Forms.Label
    $label.Text = $Message
    $label.AutoSize = $true
    $label.Location = New-Object System.Drawing.Point(10, 20)
    $label.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    
    $form.Controls.Add($label)
    $form.Show()
    
    # Auto-close after 3 seconds
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 3000
    $timer.Add_Tick({
        $form.Close()
        $timer.Stop()
    })
    $timer.Start()
} catch {
    # Fallback to simple message box if toast fails
    Write-Host "Notification shown: $Title - $Message"
}
