// Written by Joan Mendoza (edited by rae McCollum)
// Purpose: This script has a series of functions to alter user information in Firebase, such as their study access, admin access, and other customClaims information. This script was originally created as a workaround due to the Manage Users page being broken. There is a set of keys/token/other important information missing from the beginning of this script that should not be visible on Github. Please contact a BrainSwipes admin to determine where this information lives in order to be able to run this script. All of the commands to actually change data in firebase are commented out, we recommend running the function first to ensure its working how you expect before actually changing the data in Firebase. 
// Last Updated: 4/16 (clean up and add comments)

// // Authentication information
// var serviceAccount = require('brainswipes-firebase-adminsdk.json');


// Function to fetch avalability data from {'config': { <<study>> : { 'available': true/false }
async function objectForPublicAvalability() {
  // initialize value
  let defaultAccess = {};

  // Pull information for 'config' object
  const configRef = database.ref('config');
  try {
    const snapshot = await configRef.once('value');
    const configData = snapshot.val();
    // Iterate through every object in the config node
    Object.keys(configData).forEach(key => {
      // Only look at 'studies' object
      if (key !== 'studies') {
        // return blank to skip the iteration
        return;
      }
      // Iterate through each study
      const studies = configData[key];
      for (const study in studies) {
        // The actual study object
        const studyData = studies[study];
        // Check for 'available' field
        if (studyData && studyData['available'] !== undefined) {
          defaultAccess[study] = studyData['available'];
        } else {
          defaultAccess[study] = "No 'available' Data found";
        }
      }
    });
    // Return generated object
    return defaultAccess;
  } catch (error) {
    let message = 'Error fetching config data:';
    console.error(message, error);
    // Rethrow error
    throw new Error(`${message} ${error.message}`);
  }
}

// Function that iterates through all users and logs users with no custom claims 
async function listAllUsers(nextPageToken) {
  // List batch of users, 1000 at a time
  admin.auth().listUsers(1000, nextPageToken)
    .then((listUsersResult) => {
      listUsersResult.users.forEach((userRecord) => {
        // Skip users with custom claims
        // console.log('User:', userRecord.displayName);
        // Check for empty customClaims
        if (userRecord.customClaims === undefined ) {
          console.log('User:', userRecord.displayName);
          console.log('undefined', userRecord.customClaims);
        // // Access other user details
        // console.log('User ID:', userRecord.uid);
        // console.log('Email:', userRecord.email);
        // console.log('Display Name:', userRecord.displayName);
        // console.log('Custom Claims:', userRecord.customClaims);
        } else {
          console.log('Custom Claims:', userRecord.customClaims.length);
        }
        // Each user is a userRecord object
        // console.log('User:', userRecord.toJSON());
      });
      if (listUsersResult.pageToken) {
        // If there is a next page, retrieve the next batch
        listAllUsers(listUsersResult.pageToken);
      }
    })
    .catch((error) => {
      console.log('Error listing users:', error);
    }
  );
}

// // Call the function to list all users
// listAllUsers();

// Function to iterate through all users them set default custom claims for undefined users or alter a specific users' custom claims
async function setBlankUserClaims(nextPageToken) {
  // Match claims formatting
  let generatedCustomClaims = { datasets: null };
  // Get public access information from Firebase
  try {
    generatedCustomClaims['datasets'] = await objectForPublicAvalability();
    generatedCustomClaims['studyAdmin'] = await objectForPublicAvalability();
    // Set default studyAdmin values to false for even public studies
    generatedCustomClaims['studyAdmin'] = { ...generatedCustomClaims['studyAdmin'], ABIDE: false}
    generatedCustomClaims['studyAdmin'] = { ...generatedCustomClaims['studyAdmin'], BCP: false}
    generatedCustomClaims['studyAdmin'] = { ...generatedCustomClaims['studyAdmin'], HBN: false}
    generatedCustomClaims['org'] = 'University of Minnesota'
   // console.log('GeneratedCustom claims object', generatedCustomClaims);
  // Log and throw error
  } catch (error) {
    console.error('Error getting public avalability:', error.message);
    throw new Error(`${message} ${error.message}`);
  }
  // List batch of users, 1000 at a time
  admin.auth().listUsers(1000, nextPageToken)
    .then((listUsersResult) => {
      listUsersResult.users.forEach((userRecord) => {
        // Check specific user
        if (userRecord.displayName === 'raerose') {
          console.log('User:', userRecord.displayName ,userRecord.uid);
          console.log('Custom Claims:', userRecord.customClaims);
         // recreate custom claims object and change desired values
          newClaims = userRecord.customClaims
         //  newClaims['studyAdmin'] = { ...newClaims['studyAdmin'], MCTFR: true} // change studyAdmin value for specified study
		     //	newClaims['studyAdmin'] = generatedCustomClaims['studyAdmin'] // add default studyAdmin values (for someone who is missing them)
         // newClaims['datasets'] = { ...newClaims['datasets'], HBCD: true} // change access for a specified study
         // newClaims['org'] = 'University of Maryland College Park' // set someones Globus organization (needed if this was not set through an access request)
        // Send the change request to firebase
          //   admin
          // .auth()
          // .setCustomUserClaims(userRecord.uid, newClaims)
          // .then(() => {
          //    // The new custom claims will propagate to the user's ID token the
          //    // next time a new one is issued.
          //  console.log(`studyAdmin added to`, userRecord.displayName) // change this to whatever you're changing
          //  console.log("newClaim:", userRecord.customClaims)
          //  });
       // All other users
        } 
        else if (userRecord.customClaims['studyAdmin'] == null) {
          // Find users with no studyAdmin values
          // Update data in Firebase
           console.log('NO CLAIMS!', userRecord.displayName, userRecord.metadata.creationTime)
           newClaims = userRecord.customClaims
           newClaims['studyAdmin'] = generatedCustomClaims['studyAdmin']
         //  admin
         //  .auth()
         //  .setCustomUserClaims(userRecord.uid, newClaims)
         //  .then(() => {
             //~ // The new custom claims will propagate to the user's ID token the
             //~ // next time a new one is issued.
         //    console.log(`Admin Custom claims added to`, userRecord.displayName)
         //   });
        }  
        else if (userRecord.customClaims == null) {
          // Find users with no customClaims
          // Update data in Firebase
           console.log('NO CLAIMS!', userRecord.displayName, userRecord.metadata.creationTime)
           admin
           .auth()
           .setCustomUserClaims(userRecord.uid, generatedCustomClaims)
           .then(() => {
             //~ // The new custom claims will propagate to the user's ID token the
             //~ // next time a new one is issued.
             console.log(`Custom claims added to`, userRecord.displayName)
            });
        }  
        else if (userRecord.customClaims != null) {
          console.log(userRecord.displayName, "has claims!")
        } 
        else {
          console.log("This user has the studyAdmin values:", userRecord.displayName)
          // console.log('Custom Claims:', userRecord.customClaims);
          // console.log('Custom Claims:', Object.keys(userRecord.customClaims));
          // console.log('Custom Claims:', userRecord.customClaims);
          // console.log('Custom Claims:', Object.keys(userRecord.customClaims));
          // console.log('Custom Claims:',_.size(userRecord.customClaims.datasets) );
        }
      });
      if (listUsersResult.pageToken) {
        // If there is a next page, retrieve the next batch
        setBlankUserClaims(listUsersResult.pageToken);
      }
    })
    .catch((error) => {
      console.log('Error listing users:', error);
    }
  );
}

// Function to iterate through all users to add a new study to their customClaims
async function setStudyValues(nextPageToken) {
	// Match claims formatting
  let generatedCustomClaims = { datasets: null };
  // Get public access information from Firebase
  try {
    generatedCustomClaims['datasets'] = await objectForPublicAvalability();
    console.log('GeneratedCustom claims object', generatedCustomClaims);
  // Log and throw error
  } catch (error) {
    console.error('Error getting public avalability:', error.message);
    throw new Error(`${message} ${error.message}`);
  }
  // List batch of users, 1000 at a time
  admin.auth().listUsers(1000, nextPageToken)
    .then((listUsersResult) => {
      listUsersResult.users.forEach((userRecord) => {
        // Check specific user
        if (userRecord.displayName === 'raerose') {
          console.log('SPECIFICUser:', userRecord.displayName ,userRecord.uid);
          console.log('Custom Claims:', userRecord.customClaims);
          newClaims = userRecord.customClaims
        //  newClaims['datasets'] = { ...newClaims['datasets'], CHOP: true}
        // newClaims['studyAdmin'] = { ...newClaims['studyAdmin'], CHOP: true}
        // Send the change request to firebase 
         //   admin
         //   .auth()
         //   .setCustomUserClaims(userRecord.uid, newClaims)
         //   .then(() => {
              // The new custom claims will propagate to the user's ID token the
              // next time a new one is issued.
         //     console.log(`CHOP claim added to `, userRecord.displayName)
         //   });
        }        
        else if (userRecord.customClaims.Subpop == null) {
          // Look for users that don't have a specific study in their customClaims
          console.log('User with no Subpop:', userRecord.displayName ,userRecord.uid);
          console.log('Custom Claims:', Object.keys(userRecord));
          // Recreate custom claims object
          newClaims = userRecord.customClaims
          newClaims['datasets'] = { ...newClaims['datasets'], Subpop: false}
        // Send the change request to firebase
            //  admin
            //  .auth()
            //  .setCustomUserClaims(userRecord.uid, newClaims)
            //  .then(() => {
            //   //~ // The new custom claims will propagate to the user's ID token the
            //   //~ // next time a new one is issued.
            //    console.log(`Subpop claim added to `,userRecord.displayName)
            //  });
        } else {
          console.log('FOUND SUBPOP DATA FOR :', userRecord.displayName ,userRecord.uid);
        }
      });
      if (listUsersResult.pageToken) {
        // If there is a next page, retrieve the next batch
        setChopValues(listUsersResult.pageToken);
      }
    })
    .catch((error) => {
      console.log('Error listing users:', error);
    }
  );
}

// Call the function make the changes
// setStudyValues();

// Call the function make the changes
// setBlankUserClaims();

