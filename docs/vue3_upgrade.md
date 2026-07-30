## Vue3 Upgrade

To start the upgrade to Vue3 I installed node 24 in nvm and all tests will run using the newer version of node using playwright and Vitest.

```
mkdir -p tests/unit tests/e2e
cd tests
nvm install 24
nvm use 24
npm init -y
npm install --save-dev vitest @playwright/test
npx playwright install chromium
npm install --save-dev jsdom
```

To run baseline upgrade tests
```
cd tests
nvm use 24
npm run test:unit
```