# Setup for Development
All development should be done on a branch on your local machine.
Install node v17.2.0 and npm v8.1.4 (version compatibility is critical). It is recommended to use [nvm](https://nodejs.org/en/download/package-manager) for installation.
```
git clone git@github.com:DCAN-Labs/BrainSwipes.git
cd BrainSwipes
npm install
npm run dev
```
​​Your application is running here: http://localhost:8080  

The database uses [firebase appcheck](https://firebase.google.com/docs/app-check/web/recaptcha-provider) to protect the app. You may need to add a token or temporarily enable localhost.