# VSCode Workspace Settings

This directory contains optional VSCode workspace configuration for the OSRS Grand Exchange Tracker project.

## Recommended Extensions

If you're using VSCode, install these extensions for the best development experience:

### Go Development
- **Go** (`golang.go`) - Official Go language support
- **Go Test Explorer** (`premparihar.gotestexplorer`) - Test runner UI

### Frontend Development  
- **ESLint** (`dbaeumer.vscode-eslint`) - JavaScript/TypeScript linting
- **Prettier** (`esbenp.prettier-vscode`) - Code formatter
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Tailwind class autocomplete
- **PostCSS Language Support** (`csstools.postcss`) - PostCSS syntax highlighting

### Database
- **PostgreSQL** (`ckolkman.vscode-postgres`) - Database client

### Docker
- **Docker** (`ms-azuretools.vscode-docker`) - Docker support

### General
- **EditorConfig** (`editorconfig.editorconfig`) - Maintain consistent coding styles
- **GitLens** (`eamodio.gitlens`) - Enhanced Git integration
- **Error Lens** (`usernamehw.errorlens`) - Inline error highlighting

## Optional Configuration

You can create a `.vscode/settings.json` file with project-specific settings:

```json
{
  "go.useLanguageServer": true,
  "go.lintOnSave": "workspace",
  "go.formatTool": "goimports",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["frontend"],
  "typescript.tsdk": "frontend/node_modules/typescript/lib",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "[go]": {
    "editor.defaultFormatter": "golang.go"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Tasks

VSCode tasks are automatically configured for common development commands. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Tasks: Run Task" to see available tasks.
