import stylistic from '@stylistic/eslint-plugin';
import { includeIgnoreFile } from '@eslint/compat';
import path from 'path';
import { fileURLToPath } from 'url';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  stylistic.configs.customize({
    semi: true,
  }),
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
);
