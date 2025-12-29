## Development
How to set up a development environment:

### Installing nvm
We standardize Node + npm versions across development and staging by using nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.nvm/nvm.sh
```
Close and reopen terminal to use nvm

Install the version found in the ```.nvmrc``` file which should be the same as the version we have in the ```package.json``` file.

```bash
nvm install 17
nvm use 17
nvm alias default 17
```

You can confirm which version you are running
```bash
node -v
# v16.20.2
npm -v
# 8.19.4
```
You can also confirm that

``` bash
which node
node -v
```
```bash
pm2 list
pm2 describe express
````


### Get configuration files in the root directory
```
brainswipes-firebase-adminsdk.json
brainswipes-public-firebase-info.json
brainswipes-rtdb-token.json
s3-config.json
```
