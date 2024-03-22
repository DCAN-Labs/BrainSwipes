# Deployment
To build the files for use with a http server, use the command `npm run build` in the BrainSwipes folder on your local machine. These files will replace the files in the `/public` directory. To test the build locally use node express.js in the directory with the file express.js. Your app will be running on http://localhost:3000

The server running the live version of this is an instance of Amazon Linux 2 on AWS Lightsail.
Push the built files to the origin. On the lightsail instance, open the console.  `cd BrainSwipes` and `git pull`.
To update the live version of the app run `pm2 restart express.js`.
If you modify `express.js` the `pm2 restart` command will not update this file. Instead run `pm2 kill` and `pm2 start express.js`

