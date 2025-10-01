# Husky Setup
npm pkg set scripts.prepare="husky"
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
