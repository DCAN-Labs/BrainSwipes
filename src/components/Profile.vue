<template>
  <div id="profile">
    <!-- Only show stuff is the user is authenticated -->
    <b-container>
      <!-- userInfo is a prop that was passed in from App -->
      <h1>
        {{userInfo.displayName}}
      </h1>
      <h2>
        {{yourEmail}}
      </h2>

      <p class="lead">
        You have {{userData.score}} points!
      </p>
      <hr>
      <div>
        <h1>Your Study Access</h1>
        <div>
          <div class="dataset-chats-wrapper">
            <table id=study-access-table>
              <th v-for="study in Object.keys(userStudies)" :key="study" :class="{ red: !userStudies[study], green: userStudies[study] }">{{study}}</th>
            </table>
          </div>
          <div v-if="Object.keys(userRequests).length">
            <h3>Your Access Requests</h3>
            <div v-for="study in Object.keys(userRequests)" :key="study">
            <p>
              {{study}} : {{userRequests[study].status }}
            </p>
            </div>
          </div>
        </div>
        <br>
        <b-button variant="warning" @click="routeToAccessRequest">Request Study Access</b-button>
      </div>
      <hr>
      <div class="profile-pic-options">
        <h1>Choose a Profile Picture!</h1>
        <br>
        <img v-for="pic in profilePics" :key="pic" :src="`/static/profile_pics/${pic}.svg`" v-on:click="setProfilePic(pic)">
      </div>
      <hr>
      <h1>Samples you've commented on</h1>
      <div v-if="Object.keys(userChats).length" class="user-chats">
        <div v-for="study in allowedStudies" :key="study">
          <h1>{{study}}</h1>
          <div v-for="dataset in config.studies[study].datasets" :key="dataset" class="dataset-chats-wrapper">
            <div v-if="userChats[dataset]">
              <div class="dataset-title-wrapper">
                <div class="dataset-title">
                  <h2>{{config.datasets[dataset].name}}</h2>
                  <span  :class="{ messagestudy: notifications[dataset] }"></span>
                </div>
              </div>
              <div v-if="config.studies[study].available" class="dataset-chats" :class="{ scroller: Object.keys(userChats[dataset]).length > 4 }">
                <div v-for="c in userChats[dataset]" v-on:click="onChatClick(dataset, study, c.sample)" :key="c.sample" class="single-chat" :class="{ pulse: c.notify ? c.notify[userInfo.displayName] : false }">
                  <div :class="{ messagechat: c.notify ? c.notify[userInfo.displayName] : false }"></div>
                  <h3>{{c.sample}}</h3>
                  <br>
                  <span >
                    <b>{{c.username}}</b> : {{c.message}}
                  </span>
                </div>
              </div>
              <div v-else>
                <div v-if="globusAuthenticated">
                  <div v-for="c in userChats[dataset]" v-on:click="onChatClick(dataset, study, c.sample)" :key="c.sample" class="single-chat" :class="{ pulse: c.notify ? c.notify[userInfo.displayName] : false }">
                    <div :class="{ messagechat: c.notify ? c.notify[userInfo.displayName] : false }"></div>
                    <h3>{{c.sample}}</h3>
                    <br>
                    <span >
                      <b>{{c.username}}</b> : {{c.message}}
                    </span>
                  </div>
                </div>
                <div v-else>
                  <p v-for="error in globusAuthErrors" :key="error" class="globus-auth-error">{{config.errorCodes[error]}}</p>
                  <b-button @click="routeToRestricted">Login with Globus</b-button>
                </div>
              </div>
            </div>
          </div>
        <hr class="seperator">
        </div>
      </div>
      <div v-else>
        <br>
        <p>Add a comment on a sample by clicking the Help button</p>
        <img :src="blankImage" class="blankImage"/>
      </div>

    </b-container>

  </div>
</template>

<style>

  #profile {
    min-height: 100vh;
  }

  .blankImage {
    max-width: 500px;
  }

  .user-chats {
    padding-bottom: 12vh;
  }

  .dataset-chats {
    max-width: 500px;
  }

  .dataset-chats-wrapper {
    display: flex;
    justify-content: center;
  }

  .single-chat {
    padding: 1em;
    margin: 10px;
    background-color: #CCE5FF;
    position: relative;
  }

  .single-chat h3{
    font-weight: 600;
  }

  .single-chat:hover{
    cursor: pointer;
  }

  .single-chat:hover h3{
    text-decoration: underline;
  }

  .scroller {
    overflow-y: scroll;
    max-height: 360px;
  }

  .pulse {
    animation: pulse 6s;
    animation-iteration-count: infinite;
    background-color: #FFF3CD;
  }

  .messagechat {
    position: absolute;
    right: 15px;
  }

  .messagechat::after {
    display: block;
    content: '';
    background-image: url('../assets/envelope-fill.svg');
    background-repeat: no-repeat;
    background-size: 16px 16px;
    height: 16px;
    width: 16px;
  }

  .messagestudy {
    position: absolute;
    right: 0px;
    top: 0.5em;
  }

  .messagestudy::after {
    display: block;
    content: '';
    background-image: url('../assets/envelope-fill.svg');
    background-repeat: no-repeat;
    background-size: 16px 16px;
    height: 16px;
    width: 16px;
  }

  .dataset-title-wrapper {
    display: flex;
    justify-content: center;
    max-width: 500px;
    position: relative;
    align-items: baseline;
  }

  .dataset-title {
    position: relative;
    padding: 0 16px 0 16px;
  }

  @keyframes pulse {
    0% {background-color: #D1ECF1;}
    50% {background-color: #FFF3CD;}
    100% {background-color: #D1ECF1;}
  }

  .profile-pic-options img{
    height: 4em;
    margin: 2px;
  }

  .red {
  background-color: red;
  }
  .green {
    background-color: green;
  }
  #study-access-table th{
    height: 30px;
    padding: 2px;
    border: 2px ridge;
    text-align: center;
    vertical-align: middle;
    font-weight: bold;
    color: whitesmoke;
  }

</style>

<script>
/**
 * The profile component that's shown on the /profile route.
 * It displays the number of points a user has earned
 * It shows the badges they've earned and greys out the ones they still need to earn
 * It shows a chats section, which are the discussions this user has participated in
 * if the user hasn't said anything, then it shows a blank image
 * @author Anisha Keshavan
 * @license Apache 2.0
 */
import firebase from 'firebase/app';
import 'firebase/auth';
import _ from 'lodash';

export default {
  name: 'profile',
  data() {
    return {
      /**
       * an image to display if the user hasn't said anything.
       */
      blankImage: 'https://raw.githubusercontent.com/SwipesForScience/testConfig/master/images/undraw_chatting.svg?sanitize=true',
      /**
       * collection of chats the current user has participated in
       */
      userChats: {},
      /**
       * Whether the user has authenticated with Globus
       */
      globusAuthenticated: false,
      globusAuthErrors: [],
      /**
       * List of profile pic options
       */
      profilePics: ['kesh-profile-icon', 'UniversityOfMinnesota', 'dcan', 'elab', 'abide', 'connectome'],
      /**
       * list of studies the user has access to
       */
      userStudies: [],
      /**
       * object recording study access requests this user has made
       */
      userRequests: {},
    };
  },
  computed: {
    yourEmail() {
      return firebase.auth().currentUser.email;
    },
    allowedStudies() {
      const allowedStudies = [];
      Object.keys(this.datasetPrivileges).forEach((study) => {
        if (this.datasetPrivileges[study]) {
          allowedStudies.push(study);
        }
      });
      return allowedStudies;
    },
  },
  props: {
    /**
     * the authenticated user object from firebase
     */
    userInfo: {
      type: Object,
      required: true,
    },
    /**
     * the computed user data object based on userInfo
     */
    userData: {
      type: Object,
      required: true,
    },
    /**
     * the intialized firebase database
     */
    db: {
      type: Object,
      required: true,
    },
    /**
     * which studies the user can see
     */
    datasetPrivileges: {
      type: Object,
      required: true,
    },
    /**
     * keys: studies that user can access
     * values: does the user have a notification from that dataset, boolean
     */
    notifications: {
      type: Object,
      required: true,
    },
    /**
     * configuration document from the database
     */
    config: {
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
  },
  methods: {
    /**
     * gets chats for samples the current user has chatted on
     * for the specified dataset
     */
    getUserChats() {
      Object.keys(this.config.datasets).forEach(async (dataset) => {
        this.db.ref(`datasets/${dataset}/chats/chats`).on('value', (snap) => {
          const data = snap.val();
          const currentUserChats = _.reduce(data, (result, value, key) => {
            if (_.filter(Object.values(value.chats),
              { username: this.userInfo.displayName, deleted: false }).length) {
              // eslint-disable-next-line
              result[key] = { ...value.chats, notify: value.notify };
            }
            return result;
          }, {});
          const mostRecentMessages = _.reduce(currentUserChats, (result, value, key) => {
            const values = _.orderBy(_.filter(_.omit(value, 'notify'), { deleted: false }), 'time', 'desc')[0];
            result.push({
              sample: key,
              message: values.message,
              time: values.time,
              username: values.username,
              notify: value.notify,
            });
            return result;
          }, []);
          const studyChats = _.orderBy(mostRecentMessages, 'time', 'desc');
          this.$set(this.userChats, dataset, studyChats);
        });
      });
    },
    onChatClick(dataset, study, sample) {
      this.$router.push(`${study}/${dataset}/review/${sample}?f=p`);
      this.db.ref(`datasets/${dataset}/chats/chats/${sample}/notify/${this.userInfo.displayName}`).set(false);
    },
    async allowRestrictedChats() {
      if (this.globusToken.length) {
        const user = firebase.auth().currentUser;
        const email = user.email;
        const response = await this.getGlobusIdentities(this.globusToken);
        const identities = response.identities;
        const identityProviders = response.included.identity_providers;
        const errors = [];
        const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
        const organization = idTokenResult.claims.org;
        // check to see if the email in swipes is linked to the globus account
        let hasSwipesEmail = false;
        identities.forEach((identity) => {
          const identityEmail = identity.email.toString();
          if (identityEmail.toLowerCase() === email.toLowerCase()) {
            hasSwipesEmail = true;
          }
        });
        // check to see if the organiztion the user is registered with
        // is linked to the globus account
        let hasOrg = false;
        let orgUsed = false;
        identityProviders.forEach((provider) => {
          if (provider.name === organization) {
            hasOrg = true;
            const domains = provider.domains;
            identities.forEach((identity) => {
              domains.forEach((domain) => {
                if (identity.email.includes(domain)) {
                  if (identity.status === 'used') {
                    orgUsed = true;
                  }
                }
              });
            });
          }
        });
        if (identities.length === 0) {
          errors.push('noIdentities');
        } else if (!hasSwipesEmail) {
          errors.push('noSwipesEmail');
        } else if (!hasOrg) {
          errors.push('noSwipesOrg');
        } else if (!orgUsed) {
          errors.push('orgNotUsed');
        }
        if (errors.length) {
          this.globusAuthErrors = errors;
          this.globusAuthenticated = false;
        } else {
          this.globusAuthenticated = true;
        }
      }
    },
    routeToRestricted() {
      this.$router.push({ name: 'Restricted', query: { errors: this.globusAuthErrors } });
    },
    setProfilePic(pic) {
      this.db.ref(`users/${this.userInfo.displayName}/pic`).set(pic);
    },
    routeToAccessRequest() {
      this.$router.push({ name: 'AccessRequest' });
    },
    async getUserStudies() {
      const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
      const studies = idTokenResult.claims.datasets;
      delete studies.TEST;
      this.userStudies = studies;
    },
    getUserRequests() {
      this.db.ref('requests').on('value', (snap) => {
        const requests = snap.val();
        const userRequests = {};
        Object.keys(requests).forEach((study) => {
          Object.keys(requests[study]).forEach((user) => {
            if (user === this.userInfo.displayName) {
              if (requests[study][user].status !== 'accepted') {
                userRequests[study] = requests[study][user];
              }
            }
          });
        });
        this.userRequests = userRequests;
      });
    },
  },
  mounted() {
    this.getUserChats();
    this.allowRestrictedChats();
    this.getUserStudies();
    this.getUserRequests();
  },
};
</script>
