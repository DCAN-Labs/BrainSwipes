<template name="review">
  <div id="review" class="container">
    <!-- Modal Component -->
    <b-modal
      id="flagwarning" 
      :title="flagged? 'Resolve Flag' : 'WARNING'"
      ref="flagwarning"
      size="lg"
      @ok="flagImage"
    >
      <div v-if="flagged">
        <h2>Pass or Fail?</h2>
        <p>Describe why and unflag.</p>
      </div>
      <div v-else>
        <h2>Flagging an image will remove it from circulation until it has been reviewed.</h2>
        <h4>Only flag images where issues are present.</h4>
        <hr>
        <div class="flag-reasons">
          <h3>Flag the image if</h3>
          <ul>
            <li>There is no overlay</li>
            <li>There is an issue with the image not discussed in the tutorial</li>
          </ul>
          <h3>Do not flag the image if</h3>
          <ul>
            <li>You are unsure how to swipe, and have not reviewed the tutorial</li>
          </ul>
        </div>
      </div>
      <hr>
      <b-input-group :prepend="flagged ? 'Explain your reasoning' : 'Description of issue'" class="mt-3">
        <b-form-input id="flag-comment" ref="flag-comment" autocomplete="off" v-on:keyup="enableForm()" v-model="chatMessage"></b-form-input>
      </b-input-group>
      <div slot="modal-footer" class="w-100">
        <b-button @click="flagImage" :disabled="formDisabled" type="submit" variant="primary">Submit</b-button>
        <b-button @click="closeFlagWarning" type="submit" variant="primary">Cancel</b-button>
      </div>
    </b-modal>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else-if="allowed">
      <div id="tutorial-tips">
        <div class="information-wrapper">
          <div id="information">
            <h2>This is a{{imageType[1]}}.</h2>
            <div class="information" @click="toTutorial"></div>
          </div>
        </div>
        <Checklist
          :config="config"
          :imageClass="imageType[0]"
        />
      </div>
      <div>
        <ImageSwipe
        :widgetPointer="widgetPointer"
        :widgetSummary="widgetSummary"
        :playMode="''"
        ref="widget"
        :dataset="dataset"
        :config="config"
        />
      </div>
      <div id="review-controls">
        <b-button variant="danger" @click="openFlagWarning" :disabled="flagged && !isAdmin">{{flagged ? 'This sample is flagged' : 'Flag for Expert Review'}}</b-button>
        <b-button v-if="source" variant="primary" @click="toSource">Back to {{source}}</b-button>
        <b-button variant="warning" v-if="isAdmin" @click="addToGallery" :disabled="config.learn.gallery[widgetPointer]">Add Sample to Gallery</b-button>
      </div>
      <hr>
      <div class="chat container">
        <h3 class="mb-2">Chat</h3>
        <div class="chatHistory pl-3 pr-3 pt-3 pb-3 mb-3" v-if="chatOrder.length">
          <p v-for="msg in chatOrder" class="text-left" :key="msg.time">
            <b>{{msg.username}}</b>: {{msg.message}}
          </p>
        </div>
        <div v-else>
          <p>No one has said anything yet!</p>
        </div>
        <p>{{notify}}</p>
        <b-form @submit="sendChat">
          <b-form-group id="exampleInputGroup1"
                  label="Enter chat message:"
                  label-for="exampleInput1"
                  description="">
            <b-form-input id="exampleInput1"
                          type="text"
                          v-model="chatMessage"
                          required
                          placeholder="Enter your message"
                          v-on:keyup="enableForm()">
            </b-form-input>
            <b-button class="mt-2" variant="primary" :disabled="formDisabled" @click="sendChat">Send</b-button>
          </b-form-group>
        </b-form>
      </div>
    </div>


  </div>
</template>

<style>
  /*https://github.com/pudymody/tinderSwipe/blob/gh-pages/style.css*/

  .main {
    min-height: 80vh;
  }

  .chat {
    max-width: 600px;
  }

  .chatHistory {
    max-height: 200px;
    overflow: auto;
    border-style: solid;
    border-radius: 5px;
    border-width: thin;
    border-color: #17a2b8;
  }

  #review {
    padding-bottom: 10vh;
  }

  .progressive-image-main {
    z-index: 0 !important;
  }

  #tutorial-tips {
    margin: 0.5em;
  }

  #tutorial-tips h2 {
    margin-bottom: 0.5em;
    font-size: 1.3em;
  }

  .information{
    display: block;
    content: ' ';
    background-image: url('../assets/info-circle.svg');
    background-repeat: no-repeat;
    background-size: 16px 16px;
    height: 16px;
    width: 16px;
    cursor: help;
  }

  #information{
    display: flex;
  }

  .information-wrapper{
    margin-top: 5px;
    display: flex;
    justify-content: center;
  }

  #flagwarning h5{
    font-size: 2em;
    font-weight: bold;
    color: red;
  }

  #flagwarning h2{
    font-size: 1.3em;
    font-weight: bold;
    margin-bottom: 5px;
  }

  #flagwarning h3{
    font-size: 1.2em;
  }

  #flagwarning ul{
    list-style-type: disc;
    margin-left: 3em;
  }

</style>

<script>
  import firebase from 'firebase/app';
  import 'firebase/auth';
  import 'firebase/database';
  import _ from 'lodash';
  import ImageSwipe from './Widgets/ImageSwipe';
  import Checklist from './Widgets/Checklist';

  /**
   * The review component shows the widget for a pointer to a sample in its route,
   * and lets the user discuss the sample in a chat-room type UI.
   */

  export default {
    name: 'review',
    props: {
      /**
       * the computed user data object based on userInfo
       */
      userData: {
        type: Object,
        required: true,
      },
      /**
       * The config object that is loaded from src/config.js.
       * It defines how the app is configured, including
       * any content that needs to be displayed (app title, images, etc)
       * and also the type of widget and where to update pointers to data
       */
      config: {
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
       * the dataset to swipe on
       */
      dataset: {
        type: String,
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
    components: {
      ImageSwipe,
      Checklist,
    },
    data() {
      return {
        /**
         * This sample ID to discuss.
         */
        widgetPointer: '',
        /**
         * The summary of the sample ID
         */
        widgetSummary: {},
        /**
         * The chat message that the user types.
         */
        chatMessage: '',
        /**
         * This list of previous chat messages.
         */
        chatHistory: [],
        /**
         * if the user is allowed to see this
        */
        allowed: false,
        /**
         * if the component is loading
         */
        loading: true,
        /**
         * Disbales flagging without a comment
         */
        formDisabled: true,
        /**
         * disables flagging if the sample is already flagged
         */
        flagged: false,
        /**
         * if the user is an admin, sitewide or study specific
         */
        isAdmin: false,
        /**
         * the route the user was linked from
         */
        source: '',
        /**
         * the users to notify
         */
        notify: {},
      };
    },
    computed: {
      /**
       * Reverse the order of the chats so that the latest is at the top.
       */
      chatOrder() {
        const chats = [];
        _.mapValues(this.chatHistory, (v) => {
          chats.push(v);
        });
        chats.reverse();
        return chats;
      },
      /**
       * Idenfities the class of image to assist in routing to the tutorial
       */
      imageType() {
        return this.getImageType();
      },
    },
    watch: {
      /**
       * When the route changes, set the current sample ID
       * (`widgetPointer`) to the `key` parameter from the route.
       */
      $route() {
        this.widgetPointer = this.$route.params.key;
      },
    },
    /**
     * When the component is mounted, set this components `widgetPointer`
     * to the route's `key` parameter. Also grab this sample's chats and its summary.
     */
    mounted() {
      this.widgetPointer = this.$route.params.key;
      this.setSampleInfo(this.dataset);
      this.checkFlaggedStatus();
      this.getUserRoles();
      this.getSource();
    },
    methods: {
      /**
       * Method to add a new chat message. Update
       * 1. push the username, message and timestamp to `chats/sampleChats`
       * 3. set that the user has sent a chat for this sample to `chats/userChat/<username>`
       * 4. **TODO**: set that other users following this chat have something new to see.
       */
      sendChat(e) {
        e.preventDefault();
        const key = this.$route.params.key;

        this.db.ref(`datasets/${this.dataset}/chats/chats/${key}/chats`)
          .push({
            username: this.userData.username,
            message: this.chatMessage,
            time: new Date().toISOString(),
            deleted: false,
          });

        Object.keys(this.notify).forEach((user) => {
          this.notify[user] = true;
        });
        this.notify[this.userData.username] = false;
        console.log(this.notify);
        this.db.ref(`datasets/${this.dataset}/chats/chats/${key}/notify`).set(this.notify);

        this.chatMessage = '';
      },
      /**
       * Take a firebase input object and make it a nice list.
       */
      unravelFirebaseListObject(inputObject) {
        const output = [];
        _.mapValues(inputObject, (v) => {
          output.push(v);
        });
        return output;
      },
      /**
       * Get the chat history for the current sample ID.
       */
      setSampleInfo(dataset) {
        // get the chat for this sample
        this.db.ref(`datasets/${dataset}/chats/chats/${this.widgetPointer}`)
          .on('value', (snap2) => {
            const chatData = _.filter(snap2.val().chats, { deleted: false });
            this.chatHistory = chatData;
            this.notify = snap2.val().notify;
          });

        // get the widget's summary info
        this.db.ref(`datasets/${dataset}/sampleSummary`)
          .child(this.widgetPointer)
          .on('value', (snap) => {
            this.widgetSummary = snap.val();
          });
      },
      getImageType() {
        const imageType = [];
        if (this.widgetPointer.match(/atlas/i)) {
          imageType[0] = 'atlasRegistration';
          imageType[1] = 'n Atlas Registration';
        } else if (this.widgetPointer.match(/task/i)) {
          imageType[0] = 'functionalRegistration';
          imageType[1] = ' Functional Registration';
        } else {
          imageType[0] = 'surfaceDelineation';
          imageType[1] = ' Structural image';
        }
        return imageType;
      },
      toTutorial() {
        const routeData = this.$router.resolve({ name: 'Tutorial', query: { section: this.imageType[0] } });
        window.open(routeData.href, '_blank');
      },
      toSource() {
        switch (this.source) {
          case 'Play':
            this.toPlay();
            break;
          case 'Chats':
            this.$router.push({ name: 'Chats', params: { dataset: this.dataset } });
            break;
          case 'Profile':
            this.$router.push({ name: 'Profile' });
            break;
          default:
            break;
        }
      },
      toPlay() {
        const query = this.flagged ? null : { s: Buffer.from(this.widgetPointer).toString('Base64') };
        this.$router.push({ name: 'Play', params: { dataset: this.dataset }, query });
      },
      openFlagWarning() {
        this.$refs.flagwarning.show();
      },
      closeFlagWarning() {
        this.$refs.flagwarning.hide();
      },
      flagImage(e) {
        this.sendChat(e);
        this.addToFlagged();
        this.closeFlagWarning();
      },
      enableForm() {
        this.formDisabled = this.chatMessage.length === 0;
      },
      addToFlagged() {
        this.db.ref(`datasets/${this.dataset}/flaggedSamples`)
          .child(this.widgetPointer)
          .set(this.flagged ? null : this.userData.username);
      },
      checkFlaggedStatus() {
        this.db.ref(`datasets/${this.dataset}/flaggedSamples`).on('value', (snap) => {
          let flagged = false;
          if (snap.val()) {
            if (Object.keys(snap.val()).includes(this.widgetPointer)) {
              flagged = true;
            }
          }
          this.flagged = flagged;
        });
      },
      /**
       * checks if the current user is an admin
       */
      async getUserRoles() {
        const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
        const userRoles = idTokenResult.claims;
        this.isAdmin = userRoles.admin || userRoles.studyAdmin[this.dataset];
      },
      /**
       * Adds the sample to the gallery
       */
      addToGallery() {
        console.log('addToGallery');
        const update = {
          hidden: true,
          dataset: this.dataset,
        };
        this.db.ref(`config/learn/gallery/${this.widgetPointer}`).set(update);
      },
      getSource() {
        if (this.$route.query.f) {
          const from = this.$route.query.f;
          switch (from) {
            case 'h':
              this.source = 'Play';
              break;
            case 'p':
              this.source = 'Profile';
              break;
            case 'c':
              this.source = 'Chats';
              break;
            default:
              this.source = '';
              break;
          }
        }
      },
    },
    /**
     * Prevents navigation to Review when the dataset prop does not match the route name
     * or if globus authentication is incorrect
     */
    beforeRouteEnter(to, from, next) {
      next(async (vm) => {
        /* eslint-disable no-underscore-dangle */
        const available = await vm._props.db.ref(`config/studies/${to.params.dataset}/available`).once('value');
        const restricted = !available.val();
        const errors = [];
        const user = firebase.auth().currentUser;
        const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
        const userAllowed = idTokenResult.claims.datasets[to.params.dataset];
        if (to.params.dataset !== vm.dataset) {
          vm.$router.push({ name: 'Home' });
        } else if (restricted) {
          const email = user.email;
          const identities = await vm._props.getGlobusIdentities(vm._props.globusToken);
          /* eslint-enable no-underscore-dangle */
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
        } if (errors.length) {
          vm.$router.push({ name: 'Restricted', query: { errors } });
        } else if (userAllowed) {
        /* eslint-disable */
        vm.allowed = true;
        vm.loading = false;
        /* eslint-enable */
        }
      });
    },
  };
</script>
