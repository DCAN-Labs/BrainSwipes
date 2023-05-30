<template>
  <div id="sample-view">
    <h1>View a Sample</h1>
    <DatasetSelect
      :globusToken="globusToken"
      :getGlobusIdentities="getGlobusIdentities"
      :errorCodes="errorCodes"
      :config="config"
      :datasetPrivileges="datasetPrivileges"
      :surpressArchived="false"
      :showUnavailable="true"
      :useGlobus="false"
      @activateDataset="setDataset"
      @activateStudy="dataset = ''"
    />
    <div class="selector-wrapper">
      <div v-if="dataset" class="sample-selector">
        <h2>{{study}}</h2>
        <h3>{{dataset}}</h3>
        <br>
        <b-form-input
          id="sample-input"
          v-model="sample"
          placeholder="Enter sample name"
          required
        ></b-form-input>
        <br>
        <b-button
          :to="`/${study}/${dataset}/review/${sample}?f=v`"
          variant="warning"
        >
          View Sample
        </b-button>
      </div>
    </div>
  </div>

</template>

<style scoped>
  .selector-wrapper {
    display: flex;
    justify-content: center;
  }
  .sample-selector {
    width: 500px;
  }
</style>

<script>

/**
 * Forwards to reivew without refreshing the page.
 * This makes reviewing a specific sample possible when globus login is required.
 */
import DatasetSelect from './Widgets/DatasetSelect';

export default {
  name: 'sample-view',
  data() {
    return {
      /**
       * The sample to view
       */
      sample: '',
      /**
       * the dataset the sample is from
       */
      dataset: '',
      /**
       * the study the sample is from
       */
      study: '',
    };
  },
  props: {
    /**
     * the studies the user is allowed to see
     */
    datasetPrivileges: {
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
     * user info from firebase
     */
    userInfo: {
      type: Object,
      required: true,
    },
  },
  methods: {
    setDataset(study, dataset) {
      const errors = [];
      this.study = study;
      this.dataset = dataset;
      if (!this.config.studies[study].available) {
        if (!this.globusToken) {
          errors.push(1);
        }
        if (!this.userInfo.emailVerified) {
          errors.push(5);
        }
      }
      if (errors.length) {
        this.$router.push({ name: 'Restricted', query: { errors } });
      } else {
        this.$emit('changeDataset', dataset, study);
      }
    },
  },
  components: {
    DatasetSelect,
  },
};
</script>
