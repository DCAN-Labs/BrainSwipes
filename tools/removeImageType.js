#!/usr/bin/env node
var admin = require("firebase-admin");
var _ = require('lodash');
var serviceAccount = require("../brainswipes-firebase-adminsdk.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

async function getData(dataset, data){
    const ref = database.ref(`datasets/${dataset}/${data}`);
    const snap = await ref.once('value');
    const val = snap.val();
    return val;
}

function setData(dataset, path, data){
    const ref = database.ref(`datasets/${dataset}/${path}`);
    ref.set(data);
}

async function purgeSampleCounts(dataset, imageType, confirm) {
    try {
        const sampleCounts = await getData(dataset, 'sampleCounts');
        Object.keys(sampleCounts).forEach(sample => {
            if (sample.includes(imageType)) {
                delete sampleCounts[sample];
            }
        });
        if (confirm) {
            setData(dataset, 'sampleCounts', sampleCounts);
        } else {
            console.log(sampleCounts);
        }
    } catch (error) {
        console.error(error)
    }
}

async function purgeSampleSummary(dataset, imageType, confirm) {
    try {
        const sampleSummary = await getData(dataset, 'sampleSummary');
        Object.keys(sampleSummary).forEach(sample => {
            if (sample.includes(imageType)) {
                delete sampleSummary[sample];
            }
        });
        if (confirm) {
            setData(dataset, 'sampleSummary', sampleSummary);
        } else {
            console.log(sampleSummary);
        }        
    } catch (error) {
        console.error(error);
    }
}

async function purgeUserSeenSamples(dataset, imageType, confirm) {
    try {
        const userSeenSamples = await getData(dataset, 'userSeenSamples');
        Object.keys(userSeenSamples).forEach(user => {
            Object.keys(userSeenSamples[user]).forEach(sample => {
                if(sample.includes(imageType)) {
                    delete userSeenSamples[user][sample];
                }
            });
        });
        if (confirm) {
            setData(dataset, 'userSeenSamples', userSeenSamples);
        } else {
            console.log(userSeenSamples);
        }        
    } catch (error) {
        console.error(error);
    }
}

async function purgeVotes(dataset, imageType, confirm) {
    try {
        const votes = await getData(dataset, 'votes');
        Object.keys(votes).forEach(vote => {
            if(votes[vote].sample.includes(imageType)) {
                delete votes[vote];
            }
        });
        if (confirm) {
            setData(dataset, 'votes', votes);
        } else {
            console.log(votes);
        } 
    } catch (error) {
        console.error(error);
    }
}

async function purgeFlaggedSamples(dataset, imageType, confirm) {
    try {
        const flags = await getData(dataset, 'flaggedSamples');
        Object.keys(flags).forEach(sample => {
            if (sample.includes(imageType)) {
                delete flags[sample];
            }
        });
        if (confirm) {
            setData(dataset, 'flaggedSamples', flags);
        } else {
            console.log(flags);
        }        
    } catch (error) {
        console.error(error);
    }
}

async function purgeChats(dataset, imageType, confirm) {
    try {
        let chats = await getData(dataset, 'chats');
        chats = chats.chats;
        Object.keys(chats).forEach(chat => {
            if (chat.includes(imageType)) {
                delete chats[chat];
            }
        });
        if (confirm) {
            setData(dataset, 'chats/chats', chats);
        } else {
            console.log(chats);
        }        
    } catch (error) {
        console.error(error);
    }
}

function main(){
    const dataset = process.argv[2];
    const imageType = process.argv[3]
    let confirm = process.argv[4];
    if (confirm == 'confirm') {
        confirm = true;
    } else {
        confirm = false;
    }
    purgeSampleCounts(dataset, imageType, confirm);
    purgeSampleSummary(dataset, imageType, confirm);
    purgeUserSeenSamples(dataset, imageType, confirm);
    purgeVotes(dataset, imageType, confirm);
    purgeFlaggedSamples(dataset, imageType, confirm);
    purgeChats(dataset, imageType, confirm);
}

main();