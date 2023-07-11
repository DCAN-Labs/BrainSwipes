<template>
  <b-container>
    <DatasetSelect
      :globusToken="globusToken"
      :getGlobusIdentities="getGlobusIdentities"
      :config="config"
      :datasetPrivileges="datasetPrivileges"
      :surpressArchived="false"
      :showUnavailable="false"
      :useGlobus="true"
      @activateDataset="activateDataset"
    />
    <div v-if="dataset">
      <h1>Chats for {{config.datasets[dataset].name}}</h1>
      <div class="chats-div" v-if="!noData">
        <p class="lead">See which samples people are talking about</p>
        <p v-for="c in sampleChats" :key="c.sample">
          <b-alert :variant="flagged.includes(c.sample) ? 'danger' : 'primary'" show>
            <router-link :to="`/${selectedStudy}/${dataset}/review/${c.sample}?f=c`">{{c.sample}}</router-link>
            <br>
            <span >
              <b>{{c.username}}</b> : {{c.message}}
            </span>
          </b-alert>
        </p>
      </div>
      <div v-else>
        <p class="lead">No one has said anything yet!</p>
        <img :src="blankChatImage" class="blankImage"/>
      </div>
    </div>
  </b-container>
</template>

<script>
/**
 * This is the component for the /chats route. It shows all the chat messages
 * for each sample.
 */
import _ from 'lodash';
import 'firebase/auth';

import DatasetSelect from './Widgets/DatasetSelect';

export default {
  data() {
    return {
      /**
       * A flag to tell us if the /chats doc is empty on firebase.
       */
      noData: false,
      /**
       * if the user is allowed to see this dataset
       */
      allowed: false,
      /**
       * A blank image from the original SwipesForScience.
       * If this.noData is true, this image is rendered.
       */
      blankChatImage: 'https://raw.githubusercontent.com/SwipesForScience/testConfig/master/images/undraw_no_data.svg?sanitize=true',
      /**
       * the dataset to see chats for
       */
      dataset: '',
      /**
       * the selected study
       */
      selectedStudy: '',
      /**
       * list of chats for the dataset
       */
      sampleChats: [],
      /**
       * list of flagged samples
       */
      flagged: [],
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
    getChats() {
      this.db.ref(`datasets/${this.dataset}/chats/chats`).on('value', (snap) => {
        const sampleChats = snap.val();
        const chats = _.reduce(sampleChats, (result, value, key) => {
          const existingChats = _.filter(value.chats, { deleted: false });
          if (existingChats.length) {
            const values = Object.values(existingChats)[Object.keys(existingChats).length - 1];
            result.push({
              sample: key,
              message: values.message,
              time: values.time,
              username: values.username,
            });
          }
          return result;
        }, []);
        this.sampleChats = _.orderBy(chats, 'time', 'desc');
        if (!this.sampleChats.length) {
          this.noData = true;
        } else {
          this.noData = false;
        }
      });
    },
    getFlags() {
      this.db.ref(`datasets/${this.dataset}/flaggedSamples`).on('value', (snap) => {
        const flags = snap.val();
        this.flagged = flags ? Object.keys(flags) : [];
      });
    },
    activateDataset(study, dataset) {
      this.dataset = dataset;
      this.selectedStudy = study;
      this.getChats();
      this.getFlags();
    },
    async handleQuery() {
      const query = this.$route.query;
      if (query.study && query.dataset) {
        const study = query.study;
        const dataset = query.dataset;
        this.activateDataset(study, dataset);
      }
    },
  },
  mounted() {
    this.handleQuery();
  },
};
</script>

<style scoped>
  .blankImage {
    max-width: 500px;
  }
  .chats-div {
    padding-bottom: 12vh !important;
  }
  .buttons {
    text-align: center;
    display: flex;
    justify-content: center;
  }
</style>
