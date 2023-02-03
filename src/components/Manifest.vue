<template>
  <div id="manifest" v-show="allowed">
    <h1 class="manifest-title"> Select a study to update in the database </h1>
    <b-modal id="newstudy" :title="'Add a New Study to BrainSwipes'" ref="newstudy" size="lg">
      <div>
        <b-input-group prepend="Name of Study" class="mt-3">
        <b-form-input id="new-study-text" ref="new-study-text" :disabled="formLockout" autocomplete="off" v-on:keyup="enableForm()"></b-form-input>
        </b-input-group>
        <b-input-group prepend="Name of MSI S3 Bucket" class="mt-3">
        <b-form-input id="new-bucket-text" ref="new-bucket-text" :disabled="formLockout" autocomplete="off" v-on:keyup="enableForm()"></b-form-input>
        </b-input-group>
        <b-button-group size="lg">
          <b-button class="study-button" style="margin-right:0" v-bind:class="{selected: !available}" :disabled="formLockout" @click="changeAvailability(false)">Restricted access</b-button>
          <b-button class="study-button" v-bind:class="{selected: available}" :disabled="formLockout" @click="changeAvailability(true)">Available to all users</b-button>
        </b-button-group>
      </div>
      <div slot="modal-footer" class="w-100">
          <b-button @click="closeDialogSubmit" :disabled="formDisabled || formLockout" type="submit" variant="primary">Submit</b-button>
          <b-button @click="closeDialogCancel" :disabled="formLockout" type="submit" variant="primary">Cancel</b-button>
      </div>
    </b-modal>
    <b-container>
      <div v-if="!lockout" class="study-buttons-row">
        <b-button v-for="study in Object.keys(config.studies)" :key="study" class="study-button" v-bind:class="{selected: study === selectedStudy}" @click="selectStudy(study)">{{study}}</b-button><b-button class="study-button" @click="newStudy">New Study</b-button>
      </div>
      <div v-if="selectedStudy">
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
          <b-button @click="archiveStudy(selectedStudy)">{{config.studies[selectedStudy].archived ? `${selectedStudy} is archived. Click to un-archive.` : `Click to archive ${selectedStudy}`}}</b-button>
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
  .study-buttons-row {
    margin-bottom: 2vh;
  }
  .study-button {
    color: #fff;
    background-color:rgba(128,0,0,0.57);
    border-color: maroon;
    margin-right: .2em;
  }
  .study-button:hover {
    background-color: rgba(128,0,0,1);
  }
  .selected {
    background-color: rgba(128,0,0,.85);
  }
  .study-button:active, .study-button:focus {
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
       * the currently selected study
       */
      selectedStudy: '',
      /**
       * If new study is available by default
       */
      available: false,
      /**
       * control lockout while db is loading
       * similar to status, but status depends on a dataset.
       */
      lockout: false,
      /**
       * if the new study form is disabled
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
      this.db.ref(`datasets/${this.selectedStudy}/sampleCounts`).once('value', (snap) => {
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
          this.db.ref(`datasets/${this.selectedStudy}/sampleCounts`).child(key).remove();
        }
      });
    },
    /* eslint-disable */
    updateManifest(firebaseEntries) {
      const filtered = _.filter(this.manifestEntries, m => firebaseEntries.indexOf(m) < 0);
      const target = filtered.length;
      this.target = target;
      const study = this.selectedStudy;
      let current = 0;
      if (target) {
        _.map(filtered,
          (key) => {
            if (study) {
              this.db.ref(`datasets/${study}/sampleCounts`).child(key).set(0).then(() => {
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
     * choose which study's data to modify
     */
    selectStudy(study) {
      this.selectedStudy = study;
      this.status = 'loading...';
      this.addFirebaseListener();
    },
    /**
     * Show the new study menu
     */
    newStudy() {
      this.formLockout = false;
      this.$refs.newstudy.show();
    },
    /**
     * close the new study menu and submit changes
     */
    closeDialogSubmit(e) {
      this.formLockout = true;
      e.preventDefault();
      this.addStudyToFirebase();
      this.setUserDatasetPermissions();
      this.$refs.newstudy.hide();
      this.$emit('changePermissions');
    },
    /**
     * close the new study menu without submitting changes
     */
    closeDialogCancel(e) {
      e.preventDefault();
      this.$refs.newstudy.hide();
    },
    /**
     * set the default availability of the new dataset
     */
    changeAvailability(value) {
      this.available = value;
    },
    /**
     * add the empty study to firebase
     */
    addStudyToFirebase() {
      const studies = JSON.parse(JSON.stringify(this.config.studies));
      const newStudy = this.$refs['new-study-text'].localValue;
      const newBucket = this.$refs['new-bucket-text'].localValue;
      studies[newStudy] = { available: this.available, bucket: newBucket };
      this.db.ref('/config/studies').set(studies);
    },
    /**
     * set default permissions for the new study for all users
     */
    setUserDatasetPermissions() {
      const newStudy = this.$refs['new-study-text'].localValue;
      this.requestUserRolesUpdate(newStudy, this.available);
    },
    enableForm() {
      this.formDisabled = this.$refs['new-study-text'].localValue.length === 0 || this.$refs['new-bucket-text'].localValue.length === 0;
    },
    /**
     * Request an update of user roles to include new dataset
     */
    requestUserRolesUpdate(study, available) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/addStudy', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = resolve;
        xhr.onerror = reject;
        xhr.send(JSON.stringify({
          study,
          available,
          currentUser: firebase.auth().currentUser.uid,
        }));
      });
    },
    /**
     * Archive or un-archive a study.
     */
    archiveStudy(study) {
      this.db.ref(`/config/studies/${study}/archived`).set(!this.config.studies[study].archived);
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
