## MacOS
To get the web app running locally on MacOS

Install/update x-code and other development dependencies 

Install a package manager, Here is the command for Homebrew but check
[the official site](https://brew.sh/) for the most up to date command. 

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Use homebrew to install Node.js .

```bash
brew install node
```

Clone the repository 

```bash
git clone git@github.com:DCAN-Labs/BrainSwipes.git

```

Change directory
```bash
cd BrainSwipes
```

Install Node JavaScript package manager.

```bash
npm install 
```

Contact BrainSwipe administrator to get the credentials the following 2 files and place them in the root directory. 

```
s3-config.json
brainswipes-firebase-adminsdk.json
```

Start the server in development mode

```bash
npm run dev
```


### How to set up ssh to push github changes

Enter ```ls -al ~/.ssh``` to see if existing SSH keys are present.

These are the public keys filenames supported for GitHub:
```
id_rsa.pub
id_ecdsa.pub
id_ed25519.pub
```
 Check [Github Documentation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)