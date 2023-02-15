<template name="leaderboard">
  <div class="page">
    <div class="page__content grey-gradient-bg">
      <div class="page__content-container">
        <div class="leaderboard" :style="{cursor: loading ? 'wait' : 'unset'}">
          <div>
            <b-button class="btn-swipes" @click="selectedDataset = 'All Datasets'">All Datasets</b-button>
            <DatasetSelect
              :globusToken="globusToken"
              :getGlobusIdentities="getGlobusIdentities"
              :errorCodes="errorCodes"
              :config="config"
              :datasetPrivileges="datasetPrivileges"
              :surpressArchived="false"
              :showUnavailable="false"
              :useGlobus="false"
              @activateDataset="activateDataset"
            />
          </div>
          <br>
          <h1>Leaders for {{selectedDataset === 'All Datasets' ? 'All Datasets' : config.datasets[selectedDataset].name}}</h1>
          <br>
          <transition-group tag="div" name="list" class="leaderboard__rows">
            <div
              v-for="(user, index) in displayUsersList"
              v-bind:key="user.name"
              class="leaderboard__row"
            >
              <div class="leaderboard__row-container">
                <div class="leaderboard__cell user-index">{{index + 1}}</div>
                <div class="leaderboard__cell avatar">
                  <div class="img-overlay-wrap">
                    <img :src="user.pic ? `/static/profile_pics/${user.pic}.svg` : '/static/profile_pics/kesh-profile-icon.svg'" alt="Profile Avatar" class="avatar"/>
                    <img :src="index  ===0 ? '/static/profile-frame-gold.svg' : '/static/profile-frame.svg'" class="profile-frame">
                  </div>
                </div>
                <div class="leaderboard__cell username">{{user.name}}</div>
                <div v-if="index === 0" class="leaderboard__cell crown">
                  <img src="../assets/leaderboard-crown.svg" alt="Medal" />
                </div>
                <div class="leaderboard__cell user-score"><div>{{user.score}}</div></div>
              </div>
              <hr class="dashed-decorative-line" />
            </div>
          </transition-group>
          <button @click="showMore()" 
            id="leaderboard__showMore"
            class="full-size-desktop"
            v-if="displayLimit < sortedUsersList.length">
            Load more
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.leaderboard {
  display: flex;
  margin: 0 auto;
  flex-direction: column;
  font-weight: 600;
}
/* Leaderboard row */
.leaderboard__rows {
  margin-bottom: 1.25em;
}
.leaderboard__row {
  width: 100%;
  border-radius: 0.5em;
}
.leaderboard__row-container {
  padding: 1.25em;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* Leaderboard top score row */
.leaderboard__row:first-of-type .leaderboard__row-container {
  background-color: gold;
  border-radius: 8px;
  margin-bottom:  1.25em ;
}
/* Leaderboard cell */
.leaderboard__cell {
  text-align: left;
  margin-right: 1em;
}
.leaderboard__cell:first-of-type,
.leaderboard__cell:last-of-type {
  margin: 0;
}

.leaderboard__cell.user-index {
  width: calc(20% - 1em);
}
.leaderboard__cell .img-overlay-wrap {
  position: relative;
  display: inline-block;
  margin-right: 0.5em;
  width: 2.5em;
}
.leaderboard__cell .img-overlay-wrap .avatar {
  display: block;
  max-width: 100%;
  height: auto;
}
.leaderboard__cell .img-overlay-wrap .profile-frame {
  position: absolute;
  top: 0;
  left: 0;
}
.leaderboard__cell.username {
  flex-grow: 1;
  font-size: 0.875em;
}
.leaderboard__cell.crown {
  width: 2em;
}
.leaderboard__cell.user-score {
  position: relative;
  font-weight: 700;
  width: 2.5em;
  padding-left: 1em;
}
.leaderboard__cell.user-score:before {
    position: absolute;
    left: 0px;
    content: ' ';
    background-image: url('../assets/star.svg');
    background-repeat: no-repeat;
    background-size: 16px 16px;
    height: 16px;
    width: 16px;
}


.dashed-decorative-line {
  border: 0;
  background-repeat: repeat-x;
  width: 80%;
  height: 3px;
  background-image: linear-gradient(
    90deg,
    rgb(0,0,0),
    rgb(0,0,0),
    transparent 60%,
    transparent 100%
  );
  background-size: 15px 1px;
  margin:  0;
  margin-left: auto;
}
@media (min-width: 30em) {
  .leaderboard__cell.user-index {
  width: calc(10% - 1em);
}
.leaderboard__cell.crown {
  flex-grow: 1;
}
.leaderboard__cell.crown img {
  width: 50px;
}
.leaderboard__cell.username {
  padding-left: 1.25em;
}
.leaderboard__cell.user-score:before {
  left: -10px;
}
.dashed-decorative-line {
  width: 90%;

}
}
@media (min-width: 65em) {
  .page__content-container {
    background-color: white;
    padding: 1.25em 4em;
    margin-bottom: 10vh;
    border-radius: 20px;
  }
}
</style>

<script>
/**
 * The leaderboard component for the route `/leaderboard`. It displays the
 * rank, badge, player username, and score. You can sort based on the score.
 */
import _ from 'lodash';
import DatasetSelect from './Widgets/DatasetSelect';

export default {
  name: 'leaderboard',
  data() {
    return {
      /**
       * whether the chart is loading
       */
      loading: true,
      /**
       * Tell the table component to sort by the score.
       */
      sortBy: 'score',
      /**
       * Tell the table component to sort descending.
       */
      sortDesc: true,
      /**
       * The fields specification for the table component. Tell the table
       * how to display the column names, and whether or not the column can be
       * sorted.
       */
      fields: [
        'rank',
        'badge',
        {
          key: '.key',
          label: 'Player',
          sortable: false,
        },
        {
          key: 'score',
          label: 'Score',
          sortable: true,
        },
      ],
      displayLimit: 10,
      /**
       * the dataset selected to view
      */
      selectedDataset: 'All Datasets',
      /**
       * list of users and their scores sorted by score
       */
      sortedUsersList: [],
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
     * it comes directly from the `/users` document in Firebase.
     */
    allUsers: {
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
  computed: {
    displayUsersList() {
      return this.sortedUsersList.slice(0, this.displayLimit);
    },
    propsToWatch() {
      return [this.selectedDataset];
    },
  },
  watch: {
    propsToWatch: {
      handler() {
        this.createUserScoreList(this.dataset);
        this.resetDisplayLimit();
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    activateDataset(study, dataset) {
      this.selectedDataset = dataset;
    },
    showMore() {
      // Show 10 more users at a time until maximum number of users reached
      this.displayLimit =
        this.displayLimit < this.sortedUsersList.length
          ? Math.min(this.displayLimit + 10, this.sortedUsersList.length)
          : this.displayLimit;
    },
    resetDisplayLimit() {
      this.displayLimit = 10;
    },
    async createUserScoreList() {
      this.loading = true;
      let allUsernames = [];
      if (this.selectedDataset === 'All Datasets') {
        /* Removes '.key' property present on allUsers data */
        allUsernames = Object.keys(this.allUsers).filter(
          user => user !== '.key',
        );
        // eslint-disable-next-line
        allUsernames = allUsernames.map((user) => {
          return { name: user, score: this.allUsers[user].score, pic: this.allUsers[user].pic };
        });
      } else {
        const votesRef = this.db.ref(`datasets/${this.selectedDataset}/votes`);
        const votesSnap = await votesRef.once('value');
        const votes = votesSnap.val();
        // parse data
        /* eslint-disable */
        const reducedVotes = _.reduce(votes, (result, value) => {
          const name = value.user;
          result[name] ? result[name]['score'] = result[name]['score'] + 1 : result[name] = {name: name, score: 1, pic: this.allUsers[name].pic};
          return result;
        }, {});
        _.forIn(reducedVotes, (value, key) => {
          allUsernames.push(value);
        })
        /* eslint-enable */
      }
      /* Sort descending by score */
      allUsernames.sort((a, b) => b.score - a.score);
      this.sortedUsersList = allUsernames;
      this.loading = false;
    },
  },
};
</script>
