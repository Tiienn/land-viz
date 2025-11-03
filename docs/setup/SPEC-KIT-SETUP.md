# Spec-Kit Setup for Land Visualizer

## ✅ Installation Complete!

I've successfully set up Spec-Kit for your Land Visualizer project. Here's what was created:

### 📁 Directory Structure
```
land-viz/
├── memory/
│   └── constitution.md      # Your project principles and rules
├── specs/
│   └── 001-export-functionality/
│       ├── spec.md         # Feature specification
│       ├── plan.md         # Technical implementation plan
│       └── tasks.md        # Detailed task breakdown
├── templates/
│   ├── spec-template.md   # Template for new specifications
│   ├── plan-template.md   # Template for implementation plans
│   └── tasks-template.md  # Template for task lists
└── SPEC-KIT-SETUP.md      # This file
```

## 🚀 How to Use Spec-Kit

### 1. Creating a New Feature Specification

When you need to implement a new feature:

1. **Copy the template:**
   ```bash
   cp templates/spec-template.md specs/002-your-feature/spec.md
   ```

2. **Fill out the specification** with:
   - User stories
   - Acceptance criteria
   - Functional requirements
   - Mark any ambiguities with `AMBIGUITY:`

3. **Use Claude to refine it:**
   ```
   /specify
   [Paste your draft specification and ask for improvements]
   ```

### 2. Creating an Implementation Plan

After your specification is ready:

1. **Copy the plan template:**
   ```bash
   cp templates/plan-template.md specs/002-your-feature/plan.md
   ```

2. **Use Claude to generate the plan:**
   ```
   /plan
   Based on the specification in specs/002-your-feature/spec.md,
   create a technical implementation plan following our constitution.md
   ```

### 3. Breaking Down into Tasks

To get actionable tasks:

1. **Copy the tasks template:**
   ```bash
   cp templates/tasks-template.md specs/002-your-feature/tasks.md
   ```

2. **Use Claude to create tasks:**
   ```
   /tasks
   Based on the plan in specs/002-your-feature/plan.md,
   break this down into specific implementation tasks
   ```

## 📋 Your First Specification: Export Functionality

I've created a complete example for the Export functionality:

### What's Ready:

1. **Specification** (`specs/001-export-functionality/spec.md`)
   - Complete requirements for Excel, DXF, PDF, and GeoJSON exports
   - User stories and acceptance criteria
   - Edge cases and ambiguities marked

2. **Implementation Plan** (`specs/001-export-functionality/plan.md`)
   - Technical approach with 6 phases
   - File structure and architecture
   - Estimated 14 hours total

3. **Task List** (`specs/001-export-functionality/tasks.md`)
   - 20+ specific tasks
   - Code examples
   - Validation checklists

### To Start Implementation:

1. **Install dependencies:**
   ```bash
   cd app
   npm install xlsx jspdf jspdf-autotable dxf-writer
   npm install --save-dev @types/jspdf
   ```

2. **Follow the tasks** in `specs/001-export-functionality/tasks.md`

3. **Start with Phase 1** (Foundation) - 2 hours

## 🎯 Key Principles (from constitution.md)

Remember these core rules:
1. **Inline styles only** - No CSS files
2. **TypeScript strict mode** - Full typing
3. **Zustand for state** - Use useAppStore
4. **Prefer editing** - Don't create new files unnecessarily
5. **60 FPS target** - Performance matters
6. **Security first** - Client-side only

## 💡 Tips for Success

1. **Start small** - Implement one export format first (Excel)
2. **Test frequently** - Run tests after each task
3. **Use existing code** - ExportSettingsDialog already exists
4. **Follow patterns** - Look at existing services for examples
5. **Ask Claude** - Use `/specify`, `/plan`, `/tasks` commands

## 🔄 Workflow Summary

```
Idea → Specification → Plan → Tasks → Implementation
      ↑                                    ↓
      └──────── Iterate & Refine ←────────┘
```

## 📝 Next Features to Specify

Based on your roadmap, consider creating specifications for:

1. **Layer Management System** - Complex UI interactions
2. **Advanced Measurement Tools** - Distance/angle calculations
3. **Mobile Touch Optimization** - Touch gestures and responsive design
4. **Chili3D Integration** - Professional CAD capabilities

## ⚠️ Note on Spec-Kit CLI

The official Spec-Kit CLI has Unicode display issues on Windows. I've manually created the structure instead. The workflow is identical - you just use the templates directly rather than the CLI commands.

## Need Help?

- Review the templates in `/templates/`
- Check existing specs in `/specs/001-export-functionality/`
- Refer to `memory/constitution.md` for project rules
- Ask Claude to help with specifications using `/specify`, `/plan`, `/tasks`

---

**Ready to implement!** Start with the Export functionality tasks or create a new specification for your next feature.