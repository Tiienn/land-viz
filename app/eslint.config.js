import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Design Token Enforcement Rules
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
          message: 'Hard-coded hex colors are not allowed. Use design tokens from @/styles/tokens instead (e.g., tokens.colors.brand.teal).',
        },
        {
          selector: 'TemplateLiteral > TemplateElement[value.raw=/^#[0-9A-Fa-f]{3,8}$/]',
          message: 'Hard-coded hex colors in template literals are not allowed. Use design tokens from @/styles/tokens instead.',
        },
        {
          selector: 'Property[key.name="backgroundColor"] > Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
          message: 'Hard-coded background colors are not allowed. Use tokens.colors.* instead.',
        },
        {
          selector: 'Property[key.name="color"] > Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
          message: 'Hard-coded text colors are not allowed. Use tokens.colors.* instead.',
        },
        {
          selector: 'Property[key.name="borderColor"] > Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
          message: 'Hard-coded border colors are not allowed. Use tokens.colors.* instead.',
        },
        {
          selector: 'Property[key.name=/^(padding|margin|gap|width|height|top|right|bottom|left)$/] > Literal[value=/^\\d+px$/]',
          message: 'Hard-coded pixel values for spacing are not allowed. Use tokens.spacing[*] instead (e.g., tokens.spacing[4] for 16px).',
        },
        {
          selector: 'Property[key.name="fontSize"] > Literal[value=/^\\d+px$/]',
          message: 'Hard-coded font sizes are not allowed. Use tokens.typography.* instead (e.g., tokens.typography.body.size).',
        },
        {
          selector: 'Property[key.name="borderRadius"] > Literal[value=/^\\d+px$/]',
          message: 'Hard-coded border radius values are not allowed. Use tokens.radius.* instead (e.g., tokens.radius.md).',
        },
        {
          selector: 'Property[key.name="boxShadow"] > Literal[value=/rgba?\\(/]',
          message: 'Hard-coded box shadows are not allowed. Use tokens.shadows.* instead (e.g., tokens.shadows.md).',
        },
      ],
    },
  },
])
