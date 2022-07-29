'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const portfinder = require('portfinder')
const bodyParser = require('body-parser');
const S3Client = require('@aws-sdk/client-s3').S3Client;
const GetObjectCommand = require('@aws-sdk/client-s3').GetObjectCommand;
const getSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
const msiKeys = require('../msiKeys.json');
const serviceAccount = require('../brainswipes-firebase-adminsdk.json');

const s3Client = new S3Client({
  credentials: {
    accessKeyId: msiKeys.accessKeyId,
    secretAccessKey: msiKeys.secretAccessKey },
  endpoint: 'https://s3.msi.umn.edu',
  region: 'global',
},
);

function createUrl(pointer, bucket) {
  // choosing an image path from the firebase
  const key = `${pointer}.png`;
  // setting up the Get command
  const getObjectParams = {
    Bucket: bucket,
    Key: key,
  };
  const command = new GetObjectCommand(getObjectParams);
  // getting the signed URL
  const url = getSignedUrl(s3Client, command, { expiresIn: 5 });
  return url;
}

//init the firebase connection
var admin = require("firebase-admin");
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});

// standard webpack dev server config
const devWebpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,
  
  // these devServer options should be customized in /config/index.js
  devServer: {
    historyApiFallback: true,
    hot: true,
    host: process.env.HOST || config.dev.host,
    port: process.env.PORT || config.dev.port,
    open: config.dev.autoOpenBrowser,
    overlay: config.dev.errorOverlay ? {
      warnings: false,
      errors: true,
    } : false,
    publicPath: config.dev.assetsPublicPath,
    proxy: config.dev.proxyTable,
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: config.dev.poll,
    },
    setup(app){ //https://stackoverflow.com/a/47443540
      app.use(bodyParser.json());
      app.post('/Image', function (req, res) {
        (async () => {
          try {
            const pointer = req.body.pointer;
            const bucket = req.body.bucket;
            // console.log(req.body);
            if (bucket && pointer) {
              createUrl(pointer, bucket).then(imageUrl =>{
                res.send(imageUrl);
              });  
            }
          }
          catch(err) {
            console.log(err);
          }
        })()
      });
      app.post('/setRoles', function (req, res) {
        (async () => {
          const obj = req.body.obj;
          const currentUser = req.body.currentUser;

          admin.auth()
            .getUser(currentUser)
            .then((userRecord) => {
              if (userRecord.customClaims.admin) {
                admin.auth().setCustomUserClaims(obj.uid, { admin: obj.isAdmin, datasets: obj.datasets, org: obj.org }).then(() => {
                  admin.auth()
                  .getUser(obj.uid)
                  .then((userRecord) => {
                    // See the UserRecord reference doc for the contents of userRecord.
                    console.log(userRecord.customClaims);
                  })
                  .catch((error) => {
                    console.log('Error fetching user data:', error);
                  });
                });
              }
            })
            .catch((error) => {
              console.log('Error fetching user data:', error);
            });

          res.send('res');
        })()
      });
      app.post('/getAllUsers', function (req, res) {
        (async () => {
          const currentUser = req.body.currentUser;
          const allUsers = {};
          await admin.auth()
            .listUsers(1000)
            .then((listUsersResult) => {
              listUsersResult.users.forEach((userRecord) => {
                allUsers[userRecord.displayName] = userRecord.customClaims;
              });
            })
            .catch((error) => {
              console.log('Error fetching user data:', error);
            });
          res.send(allUsers);
        })()
      });
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': require('../config/dev.env')
    }), 
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    }),
    new FriendlyErrorsPlugin()
  ]
})

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      devWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${config.dev.host}:${port}`],
        },
        onErrors: config.dev.notifyOnErrors
        ? utils.createNotifierCallback()
        : undefined
      }))

      resolve(devWebpackConfig)
    }
  })
})
