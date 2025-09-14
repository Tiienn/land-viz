# Task Completion Hook for Claude
# This script is called when Claude finishes a task to trigger notifications

param(
    [string]$TaskDescription = "Task completed",
    [string]$TaskType = "General",
    [string]$Duration = "Unknown",
    [switch]$Success = $true,
    [switch]$Silent = $false
)

# Get the directory of this script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NotificationScript = Join-Path $ScriptDir "claude-notification.ps1"

# Determine notification content based on task type and success
if ($Success) {
    $Title = "✅ Claude Task Complete"
    $Message = "Task: $TaskDescription`nType: $TaskType`nDuration: $Duration"
    $Sound = "Asterisk"
} else {
    $Title = "❌ Claude Task Failed"
    $Message = "Task: $TaskDescription`nType: $TaskType`nStatus: Failed"
    $Sound = "Exclamation"
}

# Add timestamp
$Timestamp = Get-Date -Format "HH:mm:ss"
$Message += "`nCompleted: $Timestamp"

# Trigger notification if not silent
if (-not $Silent) {
    try {
        & $NotificationScript -Message $Message -Title $Title -Sound $Sound
        Write-Host "Notification sent: $Title" -ForegroundColor Green
    } catch {
        Write-Host "Failed to send notification: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Task completed silently: $TaskDescription" -ForegroundColor Yellow
}

# Log task completion
$LogFile = Join-Path $ScriptDir "..\logs\task-completion.log"
$LogDir = Split-Path -Parent $LogFile

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$LogEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $TaskType | $TaskDescription | $Duration | $(if($Success){'SUCCESS'}else{'FAILED'})"
Add-Content -Path $LogFile -Value $LogEntry

Write-Host "Task completion logged" -ForegroundColor Cyan
