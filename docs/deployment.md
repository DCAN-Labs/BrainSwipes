# Deployment
To build the files for use with a http server, use the command `npm run build` in the BrainSwipes folder on your local machine. These files will replace the files in the `/public` directory. To test the build locally use ```node express.js``` in the directory with the file express.js. Your app will be running on http://localhost:3000

The server running the live version of this is an instance of Amazon Linux 2 on AWS Lightsail.
Push the built files to the origin. On the lightsail instance, open the console.  `cd BrainSwipes` and `git pull`.
To update the live version of the app run `pm2 restart express.js`.
If you modify `express.js` the `pm2 restart` command will not update this file. Instead run `pm2 kill` and `pm2 start express.js`


We are using ``` ``` to build to create the source maps

## Setting up a staging environment
After setting up the pm2 process we set up a reverse proxy to re-rout traffic to the port it's listening on (3000).

### Setting up a reverse proxy
Create apache config file

```bash
sudo tee /etc/httpd/conf.d/staging.brainswipes.us.conf > /dev/null << 'EOF'
<VirtualHost *:80>
    ServerName staging.brainswipes.us

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog /var/log/httpd/staging-error.log
    CustomLog /var/log/httpd/staging-access.log combined
</VirtualHost>
EOF
```
Check loaded apache modules ```sudo apachectl -M | grep proxy```

If Lightsail has not loaded the proxy modules you should do it now

```bash
sudo tee /etc/httpd/conf.modules.d/00-proxy.conf > /dev/null << 'EOF'
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
EOF
```

Re-check loaded apache modules ```sudo apachectl -M | grep proxy```

Once you have check they are present restart apache:

```sudo systemctl restart httpd```

If the website loads when visiting the IP you can add the static IP to route 53()