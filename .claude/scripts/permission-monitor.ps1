# Permission Monitor Script for Claude Code
# This script monitors for permission requests and triggers notifications

param(
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
        Write-Warning "Error checking permission requests: $_"
        return $false
    }
}

# Function to show permission notification
function Show-PermissionNotification {
    $message = "Claude is requesting permission! Check Cursor for details."
    $title = "🔐 Permission Request"
    
    # Play a distinct sound for permission requests
    [System.Media.SystemSounds]::Question.Play()
    
    # Show notification dialog
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($message, $title, 'OK', 'Warning')
    
    # Show toast notification
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        
        $form = New-Object System.Windows.Forms.Form
        $form.Text = $title
        $form.Size = New-Object System.Drawing.Size(400, 120)
        $form.StartPosition = 'Manual'
        $form.Location = New-Object System.Drawing.Point([System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Width - 420, [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Height - 140)
        $form.TopMost = $true
        $form.FormBorderStyle = 'FixedDialog'
        $form.MaximizeBox = $false
        $form.MinimizeBox = $false
        $form.ShowInTaskbar = $false
        $form.BackColor = [System.Drawing.Color]::Orange
        
        $label = New-Object System.Windows.Forms.Label
        $label.Text = $message
        $label.AutoSize = $true
        $label.Location = New-Object System.Drawing.Point(10, 20)
        $label.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
        $label.ForeColor = [System.Drawing.Color]::DarkRed
        
        $form.Controls.Add($label)
        $form.Show()
        
        # Auto-close after 5 seconds
        $timer = New-Object System.Windows.Forms.Timer
        $timer.Interval = 5000
        $timer.Add_Tick({
            $form.Close()
            $timer.Stop()
        })
        $timer.Start()
    } catch {
        Write-Host "Permission notification shown: $title - $message"
    }
}

# Main execution
if (Check-PermissionRequests) {
    Show-PermissionNotification
} else {
    Write-Host "No permission requests detected."
}
