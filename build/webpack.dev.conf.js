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
const ListObjectsV2Command = require('@aws-sdk/client-s3').ListObjectsV2Command;
const getSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
const msiKeys = require('../msiKeys.json');
const serviceAccount = require('../brainswipes-firebase-adminsdk.json');

//init the firebase connection
var admin = require("firebase-admin");
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
const database = admin.database();

const s3Client = new S3Client({
  credentials: {
    accessKeyId: msiKeys.accessKeyId,
    secretAccessKey: msiKeys.secretAccessKey },
  endpoint: 'https://s3.msi.umn.edu',
  region: 'global',
},
);

async function logError(method, error) {
  try {
    const errorString = String(error)
    const ref = database.ref('log/serverErrors');
    const timestamp = Date.now();
    const server = 'dev';
    const entry = {
      timestamp,
      server,
      method,
      error: errorString
    }
    ref.push(entry);
    console.log(error);
  }
  catch(err) {
    console.log(err);
  }
}

function createUrl(pointer, bucket) {
  try{
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
  catch(err) {
    logError("createUrl", err);
  }
}

async function logUserManagement(method, modifierUid, modifiedUid, newRoles) {
  try {
    const ref = database.ref('log/userManagement');
    const timestamp = Date.now();
    const modifierUserRecord = await admin.auth().getUser(modifierUid);
    const modifier = modifierUserRecord.displayName;
    const modifiedUserRecord = await admin.auth().getUser(modifiedUid);
    const modified = modifiedUserRecord.displayName;
    const entry = {
      method,
      modifier,
      modified,
      newRoles,
      timestamp
    };
    ref.push(entry);
  }
  catch(err) {
    logError("logUserManagement", err);
  }
}

//find firebase user uid from displayname
async function findUser(displayName){
  try {
    let uid = '';
    await admin.auth()
      .listUsers(1000)
      .then((listUsersResult) => {
        listUsersResult.users.forEach((userRecord) => {
          if (userRecord.displayName === displayName){
            uid = userRecord.uid;
          }
        });
      })
      .catch((error) => {
        logError("findUser", error);
      });
    return uid;
  }
  catch(err) {
    logError("findUser", err);
  }
}

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
            if (bucket && pointer) {
              createUrl(pointer, bucket).then(imageUrl =>{
                res.send(imageUrl);
              });  
            }
          }
          catch(err) {
            logError("Image", err);
          }
        })()
      });
      app.post('/setRoles', function (req, res) {
        (async () => {
          try {
            const obj = req.body.obj;
            const currentUser = req.body.currentUser;
            const uid = await findUser(obj.name);

            admin.auth()
              .getUser(currentUser)
              .then((currentUserRecord) => {
                if (currentUserRecord.customClaims.admin) {
                  admin.auth().setCustomUserClaims(uid, { admin: obj.admin, datasets: obj.datasets, org: obj.org, studyAdmin: obj.studyAdmin }).then(() => {
                    res.send(obj);
                    logUserManagement('setRoles-full-admin', currentUser, uid, obj);
                  })
                  .catch((error) => {
                    logError("setRoles", error);
                    res.send(null);
                  });
                } else if (Object.values(currentUserRecord.customClaims.studyAdmin).includes(true)) {
                  admin.auth().getUser(uid).then((updateUserRecord) => {
                    const claims = updateUserRecord.customClaims;
                    Object.keys(currentUserRecord.customClaims.studyAdmin).forEach(study => {
                      if (currentUserRecord.customClaims.studyAdmin[study]) {
                        claims.datasets[study] = obj.datasets[study];
                        claims.studyAdmin[study] = obj.studyAdmin[study];
                      }
                    });
                    admin.auth().setCustomUserClaims(uid, { admin: claims.admin, datasets: claims.datasets, org: claims.org, studyAdmin: claims.studyAdmin }).then(() => {
                      res.send({ ...{ name: obj.name }, ...claims });
                      logUserManagement('setRoles-study-admin', currentUser, uid, claims);
                    }).catch((error) => {
                      logError("setRoles", error);
                    })
                  })
                  .catch((error) => {
                    logError("setRoles", error);
                    res.send(null);
                  });
                }
              })
              .catch((error) => {
                logError("setRoles", error);
                res.send(null);
              });
          }
          catch(err) {
            logError("setRoles", err);
          }
        })()
      });
      app.post('/setNewUserRoles', function (req, res) {
        (async () => {
          try {
            const uid = req.body.uid;
            const dbRef = database.ref('config/studies');
            const snap = await dbRef.once('value');
            const studies = snap.val();
            const datasets = {};
            const studyAdmin = {};
            Object.keys(studies).forEach(study => {
              datasets[study] = studies[study].available;
              studyAdmin[study] = false;
            });
            const defaultRoles = {
              admin: false,
              datasets,
              org: 'No Organization',
              studyAdmin
            };
            admin.auth().setCustomUserClaims(uid, defaultRoles).then(() => {
              res.send('New user roles set');
            })
            .catch((error) => {
              logError("setNewUserRoles", error);
              res.send('Error setting new user roles');
            });
          }
          catch(err) {
            logError("setNewUserRoles", err);
          }
        })()
      });
      app.post('/getAllUsers', function (req, res) {
        (async () => {
          try {
            const currentUser = req.body.currentUser;
            admin.auth()
              .getUser(currentUser)
              .then((userRecord) => {
                if (userRecord.customClaims.admin || Object.values(userRecord.customClaims.studyAdmin).includes(true)) {
                  const allUsers = {};
                  admin.auth()
                    .listUsers(1000)
                    .then((listUsersResult) => {
                      listUsersResult.users.forEach((userRecord) => {
                        allUsers[userRecord.displayName] = userRecord.customClaims;
                      });
                      res.send(allUsers);
                    })
                    .catch((error) => {
                      logError("getAllUsers", error);
                      res.send({});
                    });
                } else {
                  res.send({});
                }
              }).catch((error) => {
                logError("getAllUsers", error);
                res.send({});
              });
          }
          catch(err) {
            logError("getAllUsers", err);
          }
        })()
      });
      app.post('/addStudy', function (req, res) {
        (async () => {
          try {
            const currentUser = req.body.currentUser;
            const study = req.body.study;
            const available = req.body.available;
            admin.auth()
              .getUser(currentUser)
              .then((userRecord) => {
                if (userRecord.customClaims.admin) {
                  admin.auth()
                    .listUsers(1000)
                    .then((listUsersResult) => {
                      listUsersResult.users.forEach((userRecord) => {
                        const uid = userRecord.uid;
                        const claims = userRecord.customClaims;
                        claims.datasets[study] = available;
                        claims.studyAdmin[study] = false;
                        admin.auth().setCustomUserClaims(uid, claims);
                      });
                      res.send("Success");
                    })
                    .catch((error) => {
                      logError("addStudy", error);
                      res.send({});
                    });
                } else {
                  res.send({});
                }
              }).catch((error) => {
                logError("addStudy", error);
                res.send({});
              });
          }
          catch(err) {
            logError("addStudy", err);
          }
        })()
      });
      app.post('/updateSampleCountsFromS3', function (req, res) {
        (async () => {
          try {
            const dataset = req.body.dataset;
            const configRef = database.ref(`config/datasets/${dataset}`);
            const snap = await configRef.once('value');
            const config = snap.val();
            const bucket = config.bucket;
            const folder = config.folder ? config.folder : '';
            // get the current sample counts from the database
            const sampleCountsRef = database.ref(`datasets/${dataset}/sampleCounts`);
            const sampleCountsSnap = await sampleCountsRef.once('value');
            const sampleCounts = sampleCountsSnap.val();
            // get the list of items in the s3 bucket
            const input = {
              Bucket: bucket,
            };
            const command = new ListObjectsV2Command(input);
            const response = await s3Client.send(command);
            const regexp = new RegExp("^" + folder + "([^\/]*)\.png");
            const update = {};
            response.Contents.forEach(item => {
              const match = item.Key.match(regexp);
              if (match) {
                const sample = match[1];
                if (!Object.keys(sampleCounts).includes(sample)){
                  update[sample] = 0;
                }
              }
            });
            sampleCountsRef.update(update);
            if (Object.keys(update).length){
              res.send(`Updated sampleCounts.\n${JSON.stringify(update)}`);
            } else {
              res.send('No new PNG files found.')
            }
          } catch (err) {
            res.send(String(err));
            logError("updateSampleCountsFromS3", err);
          }
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
