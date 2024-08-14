# BrainSwipes
[BrainSwipes](https://brainswipes.us) is a web application that brings the swipe right, swipe left paradigm to quality assurance.

The DCAN Labs handle many neuroimaging datasets, and BrainSwipes helps centralize and scale the process of ensureing quality data.

BrainSwipes is built off of the open source [Swipes For Science](https://docs.swipesforscience.org/) platform.


## BrainSwipes Architecture
BrainSwipes is hosted on [AWS Lightsail](https://lightsail.aws.amazon.com/ls/webapp/home/instances?#), uses a [Firebase](https://firebase.google.com/) database to track data on swipes, and S3 storage on UMN's [Minnesota Supercomputing Institute (MSI)](https://www.msi.umn.edu/).

![Swipes app flow](./src/assets/swipes-flow.svg "Standard flow for the swipes app")

For development workflows and database management see the [readthedocs](https://brainswipes.readthedocs.io/)

## How to set up development environment

- [MacOS](docs/dev-set-up-mac-os.md)

## Other docs

- [Admin](docs/admin.md)
- [AWS](docs/aws.md)
- [Database](docs/database.md)
- [Deployment](docs/deployment.md)
- [Firebase](docs/firebase.md)
- [Globus](docs/globus.md)
- [Newstudy](docs/newstudy.md)
- [Requests](docs/requests.md)
- [Setup](docs/setup.md)
- [Tutorials](docs/tutorials.md)
- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [Datasets](docs/datasets.md)
- [Globus-dev](docs/globus-dev.md)
- [Imagetypes](docs/imagetypes.md)
- [Index](docs/index.md)
- [Ongoing](docs/ongoing.md)
- [S3 Configuration](docs/s3cfg.md)
- [Tools](docs/tools.md)
