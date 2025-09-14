# Claude Commands for Land Visualizer

Custom slash commands for the Land Visualizer project, organized by category.

## 📋 Specification-Driven Development

These commands implement the Spec-Kit workflow for systematic feature development:

### Core Workflow Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `/specify` | Create a complete feature specification | `/specify [feature-name]` |
| `/spec-workflow` | Execute full specification workflow | `/spec-workflow [feature-name]` |
| `/spec-plan` | Generate implementation plan from spec | `/spec-plan [spec-file]` |
| `/spec-tasks` | Create task breakdown from plan | `/spec-tasks [plan-file]` |
| `/spec-status` | Check specification progress | `/spec-status [feature-name]` |

### Workflow Process

```
/specify → /spec-plan → /spec-tasks → Implementation
    ↑                                        ↓
    └──────── /spec-workflow ───────────────┘
```

## 🔍 Analysis & Review Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `/review-plan` | Review GitHub issue and create plan | `/review-plan` |
| `/analyze-codebase` | Analyze project structure | `/analyze-codebase` |
| `/audit` | Security and quality audit | `/audit` |
| `/code-review` | Review code changes | `/code-review` |

## 🛠️ Development Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `/debug-session` | Start debugging session | `/debug-session` |
| `/execute` | Execute specific tasks | `/execute [task]` |
| `/git-commit` | Create git commits | `/git-commit` |
| `/read` | Read and understand files | `/read [file-path]` |

## 📊 Quick Reference

### Most Used Commands

1. **Start New Feature**
   ```
   /spec-workflow layer-management
   ```

2. **Check Progress**
   ```
   /spec-status
   ```

3. **Review Plan**
   ```
   /review-plan
   ```

4. **Create Tasks**
   ```
   /spec-tasks
   ```

## 🎯 Command Categories

### Specification Commands
- `/specify` - Write specifications
- `/spec-workflow` - Complete workflow
- `/spec-plan` - Technical planning
- `/spec-tasks` - Task breakdown
- `/spec-status` - Progress tracking

### Review Commands
- `/review-plan` - Review issues
- `/code-review` - Review code
- `/audit` - Security audit

### Execution Commands
- `/execute` - Run tasks
- `/debug-session` - Debug code
- `/git-commit` - Commit changes

### Analysis Commands
- `/analyze-codebase` - Project analysis
- `/read` - File reading

## 💡 Tips for Using Commands

1. **Start with Workflow**
   - Use `/spec-workflow` for new features
   - It guides you through the entire process

2. **Check Status Regularly**
   - Run `/spec-status` to see progress
   - Identifies blocked items early

3. **Follow the Process**
   - Specification → Plan → Tasks → Code
   - Don't skip steps for better results

4. **Use Templates**
   - Commands use templates in `/templates/`
   - Customize templates for your needs

## 📁 File Organization

Commands create files in:
```
specs/
├── 001-export-functionality/
│   ├── spec.md       # What to build
│   ├── plan.md       # How to build
│   └── tasks.md      # Steps to take
├── 002-layer-management/
└── .../
```

## 🔒 Constitution Compliance

All commands ensure compliance with:
- Inline styles only
- TypeScript strict mode
- Zustand state management
- 60 FPS performance
- Security first approach
- Testing requirements

## 🚀 Getting Started

1. **For New Features:**
   ```
   /spec-workflow [feature-name]
   ```

2. **For Existing Issues:**
   ```
   /review-plan
   ```

3. **To Check Progress:**
   ```
   /spec-status
   ```

## 📝 Notes

- Commands are in `.claude/commands/`
- Each command has detailed documentation
- Commands follow project constitution
- Templates are in `/templates/`

---

**Need help?** Just type the command name to see its documentation!