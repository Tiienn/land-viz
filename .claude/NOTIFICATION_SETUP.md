# 🔔 Claude Notification System - Setup & Usage

## Problem Fixed
You were not receiving notifications when Claude completed tasks. This system now provides reliable notifications.

## Quick Start

### Method 1: Direct PowerShell (Recommended)
```powershell
# When I complete a task, I'll run:
& "C:\Users\Tien\Documents\land-viz\.claude\scripts\claude-notification.ps1" -Message "Task completed successfully!" -Title "✅ Claude Done" -Sound "Asterisk"
```

### Method 2: Using the Hook System
```powershell
# For detailed task tracking:
& "C:\Users\Tien\Documents\land-viz\.claude\scripts\task-completion-hook.ps1" -TaskDescription "Feature implementation completed" -TaskType "Code" -Duration "5 minutes"
```

### Method 3: Quick Batch File
```cmd
# Simple notification:
.claude\scripts\notify.bat "Task completed"
```

## How I'll Use It

When I complete tasks, I'll now:

1. **Show a notification popup** with task details
2. **Play a system sound** to alert you
3. **Log the completion** for tracking
4. **Provide clear status** of what was done

## Test the System

Run this to verify notifications work:

```powershell
# Test all notification types
.\test-notification.ps1

# Test specific notification
.\claude-notification.ps1 -Message "Test notification" -Title "🔔 Test" -Sound "Asterisk"
```

## Notification Types Available

- **Asterisk** (default) - General completion
- **Beep** - Simple tasks
- **Exclamation** - Important tasks
- **Hand** - Errors or warnings
- **Question** - Interactive tasks

## Troubleshooting

### If notifications don't appear:

1. **Check Windows Focus Assist**:
   - Press `Win + I` → System → Focus Assist
   - Make sure it's not blocking notifications

2. **Test PowerShell execution**:
   ```powershell
   Get-ExecutionPolicy
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Verify the script runs**:
   ```powershell
   .\claude-notification.ps1 -Message "Test" -Title "Test"
   ```

### If you want to disable notifications temporarily:

```powershell
# Silent mode (no popup, just console output)
.\task-completion-hook.ps1 -TaskDescription "Task done" -Silent
```

## Files Created

- `.claude\scripts\task-completion-hook.ps1` - Main notification system
- `.claude\scripts\notify-completion.ps1` - Quick notification trigger
- `.claude\scripts\notify.bat` - Batch file for easy access
- `.claude\commands\notify.md` - Command documentation
- `.claude\logs\task-completion.log` - Task completion log (auto-created)

## Next Steps

1. **Test the system** with the commands above
2. **Let me know** if you receive notifications
3. **I'll start using it** for all task completions going forward

The notification system is now ready to ensure you never miss when I finish important tasks! 🎉
