<template>
  <div id="manifest" v-show="allowed">
    <b-container>
      <div v-if="selectionStage === 'start'">
        <h1 class="manifest-title">Modify an existing dataset or create a new one?</h1>
        <div>
          <b-button variant="warning" @click="changeSelectionStage('modify-existing')">Modify Existing</b-button>
          <b-button variant="warning" @click="changeSelectionStage('create-new')">Create New</b-button>
        </div>
      </div>
      <div v-else-if="selectionStage === 'create-new'">
        <h1 class="manifest-title">Add dataset to existing study or create new study?</h1>
        <b-button variant="warning" @click="changeSelectionStage('existing-study')">Existing Study</b-button>
        <b-button variant="warning" @click="changeSelectionStage('new-study')">New Study</b-button>
        <b-button variant="outline-warning" @click="changeSelectionStage('start')">Start Over</b-button>
      </div>
      <div v-else-if="selectionStage === 'modify-existing'">
        <h1 class="manifest-title">Select dataset to modify</h1>
        <b-button variant="outline-warning" @click="changeSelectionStage('start')">Start Over</b-button>
          <DatasetSelect
            :globusToken="globusToken"
            :getGlobusIdentities="getGlobusIdentities"
            :errorCodes="errorCodes"
            :config="config"
            :datasetPrivileges="datasetPrivileges"
            :surpressArchived="false"
            :showUnavailable="true"
            :useGlobus="false"
            @activateDataset="activateDataset"
            @activateStudy="activateStudy"
          />
      </div>
      <div v-else-if="selectionStage === 'new-study'">
        <h1 class="manifest-title">Create a new study and dataset</h1>
        <b-button variant="outline-warning" @click="changeSelectionStage('start')">Start Over</b-button>
      </div>
      <div v-else-if="selectionStage === 'existing-study'">
        <h1 class="manifest-title">Select a study and create a new dataset</h1>
        <b-button variant="outline-warning" @click="changeSelectionStage('start')">Start Over</b-button>
        <div v-if="!lockout" class="dataset-buttons-row">
          <b-button
            v-for="study in Object.keys(config.studies)"
            :key="study"
            class="dataset-button"
            v-bind:class="{selected: study === selectedStudy}"
            @click="selectStudy(study)">{{study}}
          </b-button>
        </div>
      </div>
      <div v-if="selectionStage === 'new-study' || selectionStage === 'existing-study'">
        <b-input-group prepend="Name of Study" class="mt-3">
          <b-form-input v-model="selectedStudy" id="new-study-text" ref="new-study-text" :disabled="formLockout || selectionStage === 'existing-study'" autocomplete="off" v-on:keyup="enableForm()"></b-form-input>
        </b-input-group>
        <b-input-group prepend="Name of Dataset" class="mt-3">
          <b-form-input id="new-dataset-text" ref="new-dataset-text" :disabled="formLockout" autocomplete="off" v-on:keyup="enableForm()"></b-form-input>
        </b-input-group>
        <b-input-group prepend="Name of MSI S3 Bucket" class="mt-3">
          <b-form-input id="new-bucket-text" ref="new-bucket-text" :disabled="formLockout" autocomplete="off" v-on:keyup="enableForm()"></b-form-input>
        </b-input-group>
        <b-button-group v-if="selectionStage === 'new-study'" size="lg">
          <b-button class="dataset-button" style="margin-right:0" v-bind:class="{selected: !available}" :disabled="formLockout" @click="changeAvailability(false)">Restricted access</b-button>
          <b-button class="dataset-button" v-bind:class="{selected: available}" :disabled="formLockout" @click="changeAvailability(true)">Available to all users</b-button>
        </b-button-group>
        <div>
          <b-button @click="onSubmit(selectionStage)" :disabled="formDisabled || formLockout" type="submit" variant="primary">Submit</b-button>
          <b-button @click="changeSelectionStage('start')" :disabled="formLockout" type="submit" variant="primary">Cancel</b-button>
        </div>
      </div>
      <div v-if="showModifyDataset">
        <div v-if="updateMethod=='s3'">
          <p class="lead">Clicking update will:<p>
          <div class="method-params">
            <ul class="method-params-list">
              <li>list all .png files in the s3 bucket defined in firebase config for the selected dataset</li>
              <li>compare with the existing tracked png files in the sampleCounts document in firebase</li>
              <li>add all missing samples to sampleCounts</li>
              <li>this method never deletes entries from sampleCounts</li>
              <li>the BrainSwipes service account needs s3:ListBucket action permission to use this method</li>
            </ul>
          </div>
          <br>
          <b-button variant="warning" @click="handlePostRequest">Update {{config.datasets[selectedDataset].name}}</b-button>
          <br>
          <p class="lead">{{response}}</p>
        </div>
        <div v-else-if="updateMethod=='json'">
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
        <div v-else>
          <p class="lead">Choose update method</p>
          <b-button variant="warning" @click="setUpdateMethod('json')">Manifest JSON</b-button>
          <b-button variant="warning" @click="setUpdateMethod('s3')">S3</b-button>
        </div>
      </div>
      <b-alert :show="error.length" variant="danger" dismissible @dismissed="changeSelectionStage('start')">{{error}}</b-alert>
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
    background-color:rgba(128,0,0,0.40);
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
  .method-params{
    display: flex;
    justify-content: center;
  }
  .method-params-list{
    max-width: 500px;
    list-style-type: disc;
  }
</style>

<script>
import _ from 'lodash';
import firebase from 'firebase/app';
import DatasetSelect from './Widgets/DatasetSelect';

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
      selectedStudy: '',
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
      /**
       * the stage of the selection process to show
       */
      selectionStage: 'start',
      /**
       * whether to show the dataset modification controls
       */
      showModifyDataset: false,
      /**
       * the error message to show
       */
      error: '',
      /**
       * what method to use to update the database
       */
      updateMethod: '',
      /**
       * the response from the server when using s3 update method
       */
      response: '',
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
     * The auth token from Globus
     */
    globusToken: {
      type: String,
      required: true,
    },
    /**
     * function that exchanges the Globus token for user information
     */
    getGlobusIdentities: {
      type: Function,
      required: true,
    },
    /**
     * errors produced by brainswipes
     */
    errorCodes: {
      type: Object,
      required: true,
    },
    /**
     * the configuration from firebase
     */
    config: {
      type: Object,
      required: true,
    },
    /**
     * the studies the user is allowed to see
     */
    datasetPrivileges: {
      type: Object,
      required: true,
    },
  },
  components: {
    DatasetSelect,
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
     * submit the new dataset/study form and add to firebase
     */
    onSubmit(mode) {
      this.formLockout = true;

      const studies = JSON.parse(JSON.stringify(this.config.studies));
      const datasets = JSON.parse(JSON.stringify(this.config.datasets));

      const newStudy = this.$refs['new-study-text'].localValue.replace(/[^0-9a-z]/gi, '');
      const name = this.$refs['new-dataset-text'].localValue;
      const newDataset = name.replace(/[^0-9a-z]/gi, '');
      const bucket = this.$refs['new-bucket-text'].localValue;

      if (datasets[newDataset]) {
        this.error = 'Dataset name already in use';
      } else if (studies[newStudy] && mode === 'new-study') {
        this.error = 'Study name already in use';
      } else {
        if (mode === 'new-study') {
          const about = {
            text: ['This is a new study! An admin will update this shortly.'],
            logo: 'test_logo.jpg',
            title: `Help QC ${newStudy} Images!`,
          };
          studies[newStudy] = { available: this.available, datasets: [newDataset], about };
          this.setUserStudyPermissions();
          this.$emit('changePermissions');
        } else if (mode === 'existing-study') {
          studies[newStudy].datasets.push(newDataset);
        } else {
          console.log('Invalid submit mode');
        }

        datasets[newDataset] = { archived: false, bucket, name, about: { text: ['This is a new dataset! An admin will update this shortly.'] } };
        this.db.ref('/config/datasets').set(datasets);
        this.db.ref('/config/studies').set(studies);

        this.changeSelectionStage('start');
      }
    },
    /**
     * set the default availability of the new dataset
     */
    changeAvailability(value) {
      this.available = value;
    },
    /**
     * set default permissions for the new study for all users
     */
    setUserStudyPermissions() {
      const newStudy = this.$refs['new-study-text'].localValue;
      this.requestUserRolesUpdate(newStudy, this.available);
    },
    /**
     * disables submission of new dataset form if any field is blank
     */
    enableForm() {
      this.formDisabled = this.$refs['new-dataset-text'].localValue.length === 0 || this.$refs['new-bucket-text'].localValue.length === 0 || this.selectedStudy.length === 0;
    },
    /**
     * Request an update of user roles to include new dataset
     * 'dataset' in this function is actually a study
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
    /**
     * Changes stage of the selection process the user is in
     */
    changeSelectionStage(stage) {
      this.showModifyDataset = false;
      this.formLockout = false;
      this.selectionStage = stage;
      this.selectDataset = '';
      this.selectedStudy = '';
      this.error = '';
    },
    activateDataset(study, dataset) {
      this.selectedDataset = dataset;
      this.selectedStudy = study;
      this.showModifyDataset = true;
      this.updateMethod = '';
      this.response = '';
      this.status = 'loading...';
      this.addFirebaseListener();
    },
    activateStudy() {
      this.updateMethod = '';
      this.showModifyDataset = false;
    },
    selectStudy(study) {
      this.selectedStudy = study;
    },
    async handlePostRequest() {
      const response = await this.postRequest().then(data =>
        data.currentTarget.responseText,
      );
      this.response = response;
    },
    postRequest() {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/updateSampleCountsFromS3', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = resolve;
        xhr.onerror = reject;
        xhr.send(JSON.stringify({
          dataset: this.selectedDataset,
        }));
      });
    },
    setUpdateMethod(method) {
      this.updateMethod = method;
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
