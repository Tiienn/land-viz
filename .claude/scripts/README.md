# Claude Notification System

This directory contains scripts and configuration for notifying you when Claude finishes its tasks or requests permission in Cursor.

## Files

- `claude-notification.ps1` - Basic notification script
- `claude-notification-advanced.ps1` - Advanced notification script with permission support
- `permission-monitor.ps1` - Permission monitoring script
- `test-notification.ps1` - Test script to verify completion notifications work
- `test-permission-notification.ps1` - Test script to verify permission notifications work
- `notification-config.json` - Configuration file for customizing notifications
- `README.md` - This documentation file

## How It Works

The notification system uses Claude Code's hook system to trigger notifications:
- **`Stop` event**: When Claude finishes a task (completion notification)
- **`Start` event**: When Claude begins a task that may require permission (permission notification)

The system is configured in `.claude/settings.local.json` and uses different sounds and visual styles for different notification types.

## Quick Start

1. **Test completion notifications**: Run the test script to verify completion notifications work:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "C:\Users\Tien\Documents\land-viz\.claude\scripts\test-notification.ps1"
   ```

2. **Test permission notifications**: Run the permission test script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "C:\Users\Tien\Documents\land-viz\.claude\scripts\test-permission-notification.ps1"
   ```

3. **Use Claude normally**: The notifications will automatically trigger when Claude finishes tasks or requests permission.

## Customization

### Changing Notification Settings

Edit `.claude/settings.local.json` and modify the hook command:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -ExecutionPolicy Bypass -File \"C:\\Users\\Tien\\Documents\\land-viz\\.claude\\scripts\\claude-notification.ps1\" -Message \"Your custom message\" -Title \"Your custom title\" -Sound \"Beep\""
          }
        ]
      }
    ]
  }
}
```

### Available Sound Options

- `Asterisk` - Standard system asterisk sound (default)
- `Beep` - Simple beep sound
- `Exclamation` - Exclamation sound
- `Hand` - Stop/error sound
- `Question` - Question sound

### Customizing Messages

You can customize the notification by modifying the parameters in the PowerShell command:

- `-Message "Your custom message"` - The notification text
- `-Title "Your custom title"` - The notification title
- `-Sound "SoundName"` - The sound to play

## Troubleshooting

### Notifications Not Working

1. **Check PowerShell execution policy**:
   ```powershell
   Get-ExecutionPolicy
   ```
   If it's `Restricted`, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Test the notification script directly**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "C:\Users\Tien\Documents\land-viz\.claude\scripts\claude-notification.ps1"
   ```

3. **Check file paths**: Ensure all file paths in the configuration are correct.

### Permission Issues

If you get permission errors, make sure the PowerShell script has the necessary permissions to:
- Play system sounds
- Display message boxes
- Access the file system

## Advanced Configuration

### Multiple Notification Types

You can set up different notifications for different types of tasks by using the `matcher` field in the hook configuration:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "error|failed|exception",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -ExecutionPolicy Bypass -File \"C:\\Users\\Tien\\Documents\\land-viz\\.claude\\scripts\\claude-notification.ps1\" -Message \"Claude encountered an issue!\" -Title \"⚠️ Claude Error\" -Sound \"Hand\""
          }
        ]
      },
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -ExecutionPolicy Bypass -File \"C:\\Users\\Tien\\Documents\\land-viz\\.claude\\scripts\\claude-notification.ps1\" -Message \"Claude finished successfully!\" -Title \"✅ Claude Done\" -Sound \"Asterisk\""
          }
        ]
      }
    ]
  }
}
```

### Disabling Notifications

To temporarily disable notifications, comment out or remove the hooks section in `.claude/settings.local.json`:

```json
{
  "permissions": {
    // ... your permissions
  }
  // "hooks": { ... } // Commented out to disable notifications
}
```

## Support

If you encounter issues with the notification system:

1. Check the PowerShell execution policy
2. Verify file paths are correct
3. Test the notification script directly
4. Check Windows notification settings
5. Ensure you have the necessary permissions

The system is designed to work on Windows 10/11 with PowerShell 5.1 or later.
