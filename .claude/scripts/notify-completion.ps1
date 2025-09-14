# Quick notification trigger for Claude task completion
# Usage: .\notify-completion.ps1 "Task description"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    [string]$Type = "General"
)

$HookScript = Join-Path $PSScriptRoot "task-completion-hook.ps1"

# Call the main hook with the message
& $HookScript -TaskDescription $Message -TaskType $Type -Success
