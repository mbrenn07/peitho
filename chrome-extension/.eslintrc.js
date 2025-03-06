module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true, // This lets ESLint know about the chrome API
  },
  extends: [
    'react-app',
    'react-app/jest'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // You can add custom rules here
  }
};
