<template>
  <div id="manifest" v-show="allowed">
    <h1 class="manifest-title"> Select a dataset to update in the database </h1>
    <b-modal id="newdataset" :title="'Add a New Dataset to BrainSwipes'" ref="newdataset" size="lg">
      <div>
        <b-input-group prepend="Name of Dataset" class="mt-3">
        <b-form-input id="new-dataset-text" ref="new-dataset-text" :disabled="formLockout" autocomplete="off" v-on:keyup="enableForm()"></b-form-input>
        </b-input-group>
        <b-input-group prepend="Name of MSI S3 Bucket" class="mt-3">
        <b-form-input id="new-bucket-text" ref="new-bucket-text" :disabled="formLockout" autocomplete="off" v-on:keyup="enableForm()"></b-form-input>
        </b-input-group>
        <b-button-group size="lg">
          <b-button class="dataset-button" style="margin-right:0" v-bind:class="{selected: !available}" :disabled="formLockout" @click="changeAvailability(false)">Restricted access</b-button>
          <b-button class="dataset-button" v-bind:class="{selected: available}" :disabled="formLockout" @click="changeAvailability(true)">Available to all users</b-button>
        </b-button-group>
      </div>
      <div slot="modal-footer" class="w-100">
          <b-button @click="closeDialogSubmit" :disabled="formDisabled || formLockout" type="submit" variant="primary">Submit</b-button>
          <b-button @click="closeDialogCancel" :disabled="formLockout" type="submit" variant="primary">Cancel</b-button>
      </div>
    </b-modal>
    <b-container>
      <div v-if="!lockout" class="dataset-buttons-row">
        <b-button v-for="dataset in Object.keys(config.studies)" :key="dataset" class="dataset-button" v-bind:class="{selected: dataset === selectedDataset}" @click="selectDataset(dataset)">{{dataset}}</b-button>
        <b-button class="dataset-button" @click="newDataset">New Dataset</b-button>
      </div>
      <div v-if="selectedDataset">
        <p class="lead" v-if="status=='complete'">You have {{sampleCounts.length}} items currently</p>
        <p v-if="status=='complete'">
          <b>Data Source:</b>
          <input type="file" id="selectFiles" value="Import" /><br />
          <b-button variant="warning" id="import" @click="importFile">Import The File!</b-button>
        </p>
        <p class="mt-3 pt-3"
        v-if="status=='complete'">Click the button below to sync your firebase database with your manifest.</p>

        <div class="mb-3 pb-3">
          <b-button v-if="status=='complete'" @click="refreshSamples">
            <span> Refresh Sample List </span>
          </b-button>
          <div v-else>
            <p>{{status}} {{progress}} / {{target}}</p>
            <b-progress :value="progress" :max="target" variant="info" striped class="mb-2"></b-progress>
          </div>
        </div>
        <div v-if="manifestEntries.length && status=='complete'" class="mt-3 pt-3">
          <small>
            Here are a few items in your manifest file. There are {{manifestEntries.length}} items in total
          </small>
        </div>
        <div v-if="status=='complete'" class="file-import">
          <pre id="result"></pre>
        </div>
        <hr>
        <div class="archived">
          <b-button @click="archiveDataset(selectedDataset)">{{config.datasets[selectedDataset].archived ? `${selectedDataset} is archived. Click to un-archive.` : `Click to archive ${selectedDataset}`}}</b-button>
          <p>Archived studies cannot be swiped on, but their data can still be viewed.</p>
        </div>
      </div>

    </b-container>

  </div>

</template>

<style>
  #result{
    text-align: start;
    min-height: 1.2em;
  }
  .manifest-title {
    margin-bottom: 2vh;
  }
  .dataset-buttons-row {
    margin-bottom: 2vh;
  }
  .dataset-button {
    color: #fff;
    background-color:rgba(128,0,0,0.57);
    border-color: maroon;
    margin-right: .2em;
  }
  .dataset-button:hover {
    background-color: rgba(128,0,0,1);
  }
  .selected {
    background-color: rgba(128,0,0,.85);
  }
  .dataset-button:active, .dataset-button:focus {
    background-color: rgba(128,0,0,.85);
  }
  .archived p{
    font-style: italic;
    color:gray;
  }
</style>

<script>
import _ from 'lodash';
import firebase from 'firebase/app';

/** Manifest panel for the /manifest route.
 * The manifest panel syncs data from the uploaded file. Only people
 * that are authorized can see this page. Authorization comes from
 * /user/<username>/admin
 */
export default {
  name: 'manifest',
  data() {
    return {
      /**
       * The loading status
       */
      status: 'loading...',
      /**
       * Progress bar for the entries being synced to firebase
       */
      progress: 0,
      target: 0,
      /**
       * The list of items to put into /sampleCounts
       */
      manifestEntries: [],
      /**
       * the /sampleCounts document from Firebase.
       */
      sampleCounts: [],
      /**
       * the currently selected dataset
       */
      selectedDataset: '',
      /**
       * If new dataset is available by default
       */
      available: false,
      /**
       * control lockout while db is loading
       * similar to status, but status depends on a dataset.
       */
      lockout: false,
      /**
       * if the new dataset form is disabled
       */
      formDisabled: true,
      /**
       * if the new dataset form is locked out
       */
      formLockout: false,
      /**
       * if the user is allowed to see this component
       */
      allowed: false,
    };
  },
  props: {
    /**
     * the intialized firebase database
     */
    db: {
      type: Object,
      required: true,
    },
    /**
     * The config from the db
     */
    config: {
      type: Object,
      required: true,
    },
  },
  methods: {
    /**
     * Reads the uploaded file and puts it somewhere
     * https://stackoverflow.com/a/59162687
     */
    /* eslint-disable */
    importFile() {
      const files = document.getElementById('selectFiles').files;
      if (files.length <= 0) {
        return false;
      }
      const fr = new FileReader();
      fr.onload = (e) => {
        const result = JSON.parse(e.target.result);
        this.manifestEntries = result;
        const formatted = JSON.stringify(result.slice(0, 100), null, 2);
        document.getElementById('result').innerHTML = formatted;
      };
      fr.readAsText(files.item(0));
    },
    /* eslint-enable */
    /**
     * This method keeps track of sampleCounts, but only loads it once.
     */
    addFirebaseListener() {
      this.db.ref(`datasets/${this.selectedDataset}/sampleCounts`).once('value', (snap) => {
        /* eslint-disable */
        this.sampleCounts = _.map(snap.val(), (val, key) => {
          return { '.key': key, '.value': val };
        });
        /* eslint-enable */
        this.status = 'complete';
      });
    },
    /**
     * this method runs in a worker, to check each item in /sampleCounts and each
     * item in manifestEntries. If the item is in manifestEntries but not in /sampleCounts,
     * it is added. If its not in manifestEntries but is in sampleCounts, its removed.
     */
    refreshSamples() {
      if (this.manifestEntries.length) {
        this.status = 'refreshing';
        this.lockout = true;
        this.syncEntries();
        this.lockout = false;
        this.manifestEntries = [];
        this.addFirebaseListener();
      } else {
        document.getElementById('result').innerHTML = 'Please upload a file';
      }
    },
    /**
    * sync manifest entries and firebase entries
    */
    syncEntries() {
      const firebaseEntries = _.map(this.sampleCounts, v => v['.key']);

      // first, for anything in manifest entries that isn't in firebase db
      // add them.

      this.updateManifest(firebaseEntries);

      // next check all of the items in firebase db
      // and remove any that aren't in manifestEntries
      _.map(firebaseEntries, (key) => {
        // check to see if the key is in the manifest.
        if (this.manifestEntries.indexOf(key) < 0) {
          // since the key isn't there, remove it from firebase.
          this.db.ref(`datasets/${this.selectedDataset}/sampleCounts`).child(key).remove();
        }
      });
    },
    /* eslint-disable */
    updateManifest(firebaseEntries) {
      const filtered = _.filter(this.manifestEntries, m => firebaseEntries.indexOf(m) < 0);
      const target = filtered.length;
      this.target = target;
      const dataset = this.selectedDataset;
      let current = 0;
      if (target) {
        _.map(filtered,
          (key) => {
            if (dataset) {
              this.db.ref(`datasets/${dataset}/sampleCounts`).child(key).set(0).then(() => {
                current += 1;
                this.progress += 1;
                if (current === target) {
                    // We then have treated all the objects
                  return ('done');
                }
              })
              .catch(() => {
                return ('error');
              });
            }
          });
      }
    },
    /* eslint-enable */
    /**
     * choose which dataset's data to modify
     */
    selectDataset(dataset) {
      this.selectedDataset = dataset;
      this.status = 'loading...';
      this.addFirebaseListener();
    },
    /**
     * Show the new dataset menu
     */
    newDataset() {
      this.formLockout = false;
      this.$refs.newdataset.show();
    },
    /**
     * close the new dataset menu and submit changes
     */
    closeDialogSubmit(e) {
      this.formLockout = true;
      e.preventDefault();
      this.addDatasetToFirebase();
      this.setUserDatasetPermissions();
      this.$refs.newdataset.hide();
      this.$emit('changePermissions');
    },
    /**
     * close the new dataset menu without submitting changes
     */
    closeDialogCancel(e) {
      e.preventDefault();
      this.$refs.newdataset.hide();
    },
    /**
     * set the default availability of the new dataset
     */
    changeAvailability(value) {
      this.available = value;
    },
    /**
     * add the empty dataset to firebase
     */
    addDatasetToFirebase() {
      const studies = JSON.parse(JSON.stringify(this.config.studies));
      const newDataset = this.$refs['new-dataset-text'].localValue;
      const newBucket = this.$refs['new-bucket-text'].localValue;
      studies[newDataset] = { available: this.available, bucket: newBucket };
      this.db.ref('/config/studies').set(studies);
    },
    /**
     * set default permissions for the new dataset for all users
     */
    setUserDatasetPermissions() {
      const newDataset = this.$refs['new-dataset-text'].localValue;
      this.requestUserRolesUpdate(newDataset, this.available);
    },
    enableForm() {
      this.formDisabled = this.$refs['new-dataset-text'].localValue.length === 0 || this.$refs['new-bucket-text'].localValue.length === 0;
    },
    /**
     * Request an update of user roles to include new dataset
     */
    requestUserRolesUpdate(dataset, available) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/addStudy', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = resolve;
        xhr.onerror = reject;
        xhr.send(JSON.stringify({
          dataset,
          available,
          currentUser: firebase.auth().currentUser.uid,
        }));
      });
    },
    /**
     * Archive or un-archive a dataset.
     */
    archiveDataset(dataset) {
      this.db.ref(`/config/datasets/${dataset}/archived`).set(!this.config.datasets[dataset].archived);
    },
  },
  beforeRouteEnter(to, from, next) {
    next(async (vm) => {
      const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
      const admin = idTokenResult.claims.admin;
      if (admin) {
        /* eslint-disable */
        vm.allowed = true;
        /* eslint-enable */
        next();
      } else {
        vm.$router.push({ name: 'Unauthorized' });
      }
    });
  },
};
</script>
