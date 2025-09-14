# Compact Mode Notification Script
# Notifies when UI compact mode operations finish

param(
    [string]$Message = "Compact mode operation completed!",
    [string]$Title = "Compact Done",
    [string]$Sound = "Beep",
    [string]$Operation = "toggle"
)

# Play sound for compact operations
switch ($Sound) {
    "Asterisk" { [System.Media.SystemSounds]::Asterisk.Play() }
    "Beep" { [System.Media.SystemSounds]::Beep.Play() }
    "Exclamation" { [System.Media.SystemSounds]::Exclamation.Play() }
    "Hand" { [System.Media.SystemSounds]::Hand.Play() }
    "Question" { [System.Media.SystemSounds]::Question.Play() }
    default { [System.Media.SystemSounds]::Beep.Play() }
}

# Show notification dialog
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show($Message, $Title, 'OK', 'Information')

# Show toast notification
try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    
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
    $form.BackColor = [System.Drawing.Color]::LightBlue
    
    $label = New-Object System.Windows.Forms.Label
    $label.Text = $Message
    $label.AutoSize = $true
    $label.Location = New-Object System.Drawing.Point(10, 20)
    $label.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $label.ForeColor = [System.Drawing.Color]::DarkBlue
    
    $form.Controls.Add($label)
    $form.Show()
    
    # Auto-close after 2 seconds
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 2000
    $timer.Add_Tick({
        $form.Close()
        $timer.Stop()
    })
    $timer.Start()
} catch {
    Write-Host "Compact notification shown: $Title - $Message"
}