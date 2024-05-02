#!/usr/bin/env node
const axios = require('axios');
const S3Client = require('@aws-sdk/client-s3').S3Client;
const PutObjectCommand = require('@aws-sdk/client-s3').PutObjectCommand;
const rtdbToken = require('../../brainswipes-rtdb-token.json');
const s3Config = require('../../s3-config.json');

async function main() {
  try {
    // get date string | https://stackoverflow.com/a/1056730/11878912
    const date = new Date();
    const curr_date = date.getDate();
    const curr_month = date.getMonth() + 1;
    const curr_year = date.getFullYear();
    const today = curr_year + "-" + curr_month + "-" + curr_date;
    const filename = `brainswipes-firebase-backup-${today}.json`
    // get data from firebase
    const backup = await axios.get(`https://brainswipes-default-rtdb.firebaseio.com/.json?auth=${rtdbToken.token}`);
    console.log('Got firebase backup!');

    // put data in s3
    const s3Client = new S3Client(s3Config.default);
    const input = {
      Bucket: 'brainswipes-backups',
      Key: filename,
      Body: JSON.stringify(backup.data),
      ContentType: "application/json",
    }
    const command = new PutObjectCommand(input);
    const response = await s3Client.send(command);
    // console.log(response);
    console.log(`Backup JSON file added to S3:\n${filename}`);
  } catch (err) {
    console.log("error getting backup:\n", err)
  }
};

main();