<template name="gallery">
  <div id="gallery" class="container">
    <!-- Title -->
    <div>
      <h1>Gallery of Advanced Cases</h1>
      <p class="lead">Get expert advice on difficult samples.</p>
      <p>Have something you want added? Flag it by clicking the Help button.</p>
      <hr>
    </div>
    <div v-if="!loading">
      <div v-for="sample in Object.keys(gallery)" :key="sample">
        <div v-if="!gallery[sample].hidden || adminRoles.studyAdmin[gallery[sample].dataset] || adminRoles.admin" :class="gallery[sample].hidden ? 'hidden-item' : ''" class="gallery-item" >
          <div v-if="(config.studies[gallery[sample].study].available) || (globusAuthenticated && datasetPrivileges[gallery[sample].study])">
            <div v-if="gallery[sample].hidden" class="gallery-form-wrapper">
              <div class="gallery-form">
                <b-form>
                  <b-form-group
                    :id="'issue-label-group-' + sample"
                    label="Issue Label:"
                    :label-for="'issue-label-' + sample"
                    description="A breif description of the issue, the title of the gallery entry."
                  >
                    <b-form-input
                      :id="'issue-label-' + sample"
                      v-model="form[sample].label"
                      placeholder="Enter issue label"
                      required
                    ></b-form-input>
                  </b-form-group>
                  <b-form-group
                    :id="'issue-description-group-' + sample"
                    label="Issue Description:"
                    :label-for="'issue-description-' + sample"
                    description="A full description of the issue including rational for why this image passes or fails."
                  >
                    <b-form-input
                      :id="'issue-description-' + sample"
                      v-model="form[sample].text"
                      placeholder="Enter full issue description"
                      required
                    ></b-form-input>
                  </b-form-group>
                  <b-form-group label="Does the sample Pass or Fail?">
                    <b-form-radio-group
                      :id="'radio-group-' + sample"
                      v-model="form[sample].answer"
                      :options="[{ text: 'Pass', value: 1 }, { text: 'Fail', value: 0 }, { text: 'Flag for Removal', value: 2 }]"
                      name="radio-options"
                    ></b-form-radio-group>
                  </b-form-group>
                  <p>Choose which checklist items should be checked.</p>
                  <div class="checklist-background">
                    <Checklist
                      :config="config"
                      :imageClass="getImageType(sample)[0]"
                      :checks="gallery[sample].checks"
                      :sample="sample"
                      v-on:checkBoxClick="updateCheckBox"
                    />
                  </div>
                  <br>
                  <p class="submit-errors" v-for="error in submitErrors[sample]" :key="error">Please fill out the {{errorToName[error]}}</p>
                  <b-button @click="onSubmit(sample)" variant="primary">Submit</b-button>
                  <b-button @click="onReset(sample)" variant="danger">Reset</b-button>
                </b-form>
                <br>
              </div>
            </div>
            <div v-else class="gallery-info">
              <h2>{{gallery[sample].label}}</h2>
              <p>{{gallery[sample].text}}</p>
              <Checklist
                :config="config"
                :imageClass="getImageType(sample)[0]"
                :checks="gallery[sample].checks"
              />
            </div>
            <ImageSwipe
              :widgetPointer="sample"
              :playMode="'tutorial'"
              :identifier="sample"
              :tutorialStep="gallery[sample].answer"
              ref="widget"
              :dataset="gallery[sample].dataset"
              :config="config"
            />
          </div>
          <div v-else-if="datasetPrivileges[gallery[sample].dataset]">
            <p v-for="error in globusAuthErrors" :key="error" class="globus-auth-error">{{errorCodes[error]}}</p>
            <b-button @click="routeToRestricted">Login with Globus</b-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>

  .img {
    max-height: 80vh;
    width: 100%;
    max-width: 500px;
    margin-bottom: 35px;
  }

  .gallery-item h2{
    font-size: 1.5em;
    font-weight: 700;
    color: #640000;
    margin-bottom: 10px;
  }

  .gallery-item {
    padding-bottom: 15vh;
  }

  .gallery-info {
    padding-bottom: 10px;
  }

  .hidden-item {
    background-image: linear-gradient(to right, rgba(255,0,0,0), rgba(255,0,0,0.7), rgba(255,0,0,0));
  }

  .gallery-form-wrapper {
    display: flex;
    justify-content: center;
  }

  .gallery-form {
    max-width: 500px;
  }

  .checklist-background {
    background-color: whitesmoke;
  }

  .submit-errors {
    font-weight: bold;
  }

</style>

<script>
  import firebase from 'firebase/app';
  import Vue from 'vue';
  import ImageSwipe from './Widgets/ImageSwipe';
  import Checklist from './Widgets/Checklist';

  /* eslint-enable */

  export default {
    name: 'gallery',
    components: {
      ImageSwipe,
      Checklist,
    },
    data() {
      return {
        /**
         * The object that holds the input from the form for new gallery items
         */
        form: {},
        /**
         * Tracks if the user can see unfinished entries
         */
        adminRoles: {},
        loading: true,
        /**
         * displays submit errors
         */
        submitErrors: {},
        errorToName: {
          label: 'Issue Label',
          answer: 'Pass or Fail',
          checks: 'Checklist',
          text: 'Issue Description',
        },
        /**
         * Whether the user has authenticated with Globus
         */
        globusAuthenticated: false,
        globusAuthErrors: [],
      };
    },
    props: {
      /**
       * configuration document from the database
      */
      config: {
        type: Object,
        required: true,
      },
      /**
       * The firebase database
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
       * what datasets the user is allowed to see
       */
      datasetPrivileges: {
        type: Object,
        required: true,
      },
    },
    computed: {
      gallery() {
        return this.config.learn.gallery;
      },
    },
    methods: {
      getImageType(pointer) {
        const imageType = [];
        if (pointer.match(/atlas/i)) {
          imageType[0] = 'atlasRegistration';
          imageType[1] = 'Atlas Registration';
        } else if (pointer.match(/task/i)) {
          imageType[0] = 'functionalRegistration';
          imageType[1] = 'Functional Registration';
        } else {
          imageType[0] = 'surfaceDelineation';
          imageType[1] = 'Structural Image';
        }
        return imageType;
      },
      onSubmit(sample) {
        const valid = this.validateSubmit(sample);
        if (valid.length) {
          console.log(valid);
          Vue.set(this.submitErrors, sample, valid);
        } else {
          this.form[sample].hidden = false;
          this.db.ref(`config/learn/gallery/${sample}`).set(this.form[sample]);
        }
      },
      validateSubmit(sample) {
        const missing = [];
        if (!Object.prototype.hasOwnProperty.call(this.form[sample], 'label')) {
          missing.push('label');
        }
        if (!Object.prototype.hasOwnProperty.call(this.form[sample], 'answer')) {
          missing.push('answer');
        }
        if (!Object.prototype.hasOwnProperty.call(this.form[sample], 'checks')) {
          missing.push('checks');
        } else if (this.form[sample].checks.includes('')) {
          missing.push('checks');
        }
        if (!Object.prototype.hasOwnProperty.call(this.form[sample], 'text')) {
          missing.push('text');
        }
        return missing;
      },
      onReset(sample) {
        this.form[sample] = this.config.learn.gallery[sample];
      },
      copyGalleryConfig() {
        const copy = JSON.parse(JSON.stringify(this.config.learn.gallery));
        this.form = copy;
      },
      getAdminRoles() {
        firebase.auth().currentUser.getIdTokenResult(true).then((idTokenResult) => {
          const adminRoles = {};
          adminRoles.studyAdmin = idTokenResult.claims.studyAdmin;
          adminRoles.admin = idTokenResult.claims.admin;
          this.adminRoles = adminRoles;
          this.loading = false;
        });
      },
      updateCheckBox(sample, userChecks) {
        const checks = [];
        Object.values(userChecks).forEach((value) => {
          switch (value) {
            case 'checked':
              checks.push(true);
              break;
            case 'unchecked':
              checks.push(false);
              break;
            default:
              checks.push('');
              break;
          }
        });
        Vue.set(this.form[sample], 'checks', checks);
      },
      async allowRestrictedSamples() {
        const user = firebase.auth().currentUser;
        const email = user.email;
        const identities = await this.getGlobusIdentities(this.globusToken);
        const errors = [];
        const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
        const organization = idTokenResult.claims.org;
        if (Object.keys(identities).length === 0) {
          errors.push(1);
        } else if (!identities[email]) {
          errors.push(2);
        } else if (identities[email][0] !== organization) {
          errors.push(3);
        } else if (identities[email][1] !== 'used') {
          errors.push(4);
        }
        if (errors.length) {
          this.globusAuthErrors = errors;
          this.globusAuthenticated = false;
        } else {
          this.globusAuthenticated = true;
        }
      },
      routeToRestricted() {
        this.$router.push({ name: 'Restricted', query: { errors: this.globusAuthErrors } });
      },
    },
    mounted() {
      this.copyGalleryConfig();
      this.getAdminRoles();
      this.allowRestrictedSamples();
    },
  };
</script>
