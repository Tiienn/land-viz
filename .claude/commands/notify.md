# /notify - Task Completion Notification

Send notifications when Claude completes tasks to ensure you don't miss important updates.

## Usage

```
/notify [message]
```

## What This Command Does

This command triggers a notification system that:

1. **Shows visual notification** with task details
2. **Plays system sound** to alert you
3. **Logs completion** for tracking
4. **Provides task context** with timestamps

## Quick Examples

```bash
# Basic notification
/notify "Code refactoring completed"

# With task type
/notify "Database migration finished" --type "Database"

# Silent completion (no notification)
/notify "Background task done" --silent
```

## Integration with Claude Workflow

When I complete tasks, I can now call:

```powershell
# From PowerShell
.\notify-completion.ps1 "Feature implementation completed"

# From batch
notify.bat "Bug fix deployed"

# Direct notification
& "C:\Users\Tien\Documents\land-viz\.claude\scripts\claude-notification.ps1" -Message "Task completed" -Title "✅ Claude Done"
```

## Notification Types

- **General**: Default task completion
- **Code**: Code changes, refactoring
- **Database**: Database operations
- **Build**: Build, compile, deploy
- **Test**: Testing, validation
- **Debug**: Debugging, troubleshooting

## Features

- **Visual popup** with task details
- **System sounds** (Asterisk, Beep, Exclamation, Hand, Question)
- **Auto-dismiss** after 3 seconds
- **Task logging** for audit trail
- **Timestamp tracking** for performance monitoring

## Configuration

Edit `.claude\scripts\claude-notification.ps1` to customize:
- Default sound
- Notification duration
- Popup position
- Message format

## Troubleshooting

If notifications stop working:

1. **Test the system**:
   ```powershell
   .\test-notification.ps1
   ```

2. **Check Windows settings**:
   - Notifications enabled for PowerShell
   - Focus Assist not blocking

3. **Verify execution policy**:
   ```powershell
   Get-ExecutionPolicy
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## Log Files

Task completions are logged to:
```
.claude\logs\task-completion.log
```

Format: `YYYY-MM-DD HH:mm:ss | Type | Description | Duration | Status`
