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
nvm install 16
nvm use 16
nvm alias default 16
```

You can confirm which version you are running
```bash
node -v
# v16.20.2
npm -v
# 8.19.4
```
### Get configuration files in the root directory
```
brainswipes-rtdb-token.json
brainswipes-firebase-adminsdk.json
s3-config.json
```
