<template name="review">
  <div id="review" class="container">

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
      <b-form @submit="sendChat">
        <b-form-group id="exampleInputGroup1"
                label="Enter chat message:"
                label-for="exampleInput1"
                description="">
          <b-form-input id="exampleInput1"
                        type="text"
                        v-model="chatMessage"
                        required
                        placeholder="Enter your message">
          </b-form-input>
          <b-button class="mt-2" variant="primary" @click="sendChat">Send</b-button>
        </b-form-group>
      </b-form>

    </div>
    <div>
      <WidgetSelector :widgetType="widgetType"
       :widgetPointer="widgetPointer"
       :widgetProperties="widgetProperties"
       :widgetSummary="widgetSummary"
       :userSettings="userSettings"
       :playMode="''"
       ref="widget"
      />
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

</style>

<script>
  import _ from 'lodash';
  import { ref, set, onValue, push } from 'firebase/database';
  import WidgetSelector from './WidgetSelector';
  /**
   * The review component shows the widget for a pointer to a sample in its route,
   * and lets the user discuss the sample in a chat-room type UI.
   */

  export default {
    name: 'review',
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
       * the various levels, the points need to reach the levels,
       * and the badges (colored and greyed out) to display
       */
      levels: {
        type: Object,
        required: true,
      },
      /**
       * the user's current level
       */
      currentLevel: {
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
    },
    components: {
      WidgetSelector,
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
         * The user's settings from firebase
         */
        userSettings: {},
        /**
         * The chat message that the user types.
         */
        chatMessage: '',
        /**
         * This list of previous chat messages.
         */
        chatHistory: [],
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
       * The widgetType to display, based on the config value.
       */
      widgetType() {
        return this.config.widgetType;
      },
      /**
       * The properties of the widget, from the config.
       */
      widgetProperties() {
        return this.config.widgetProperties;
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
      this.setSampleInfo();
    },
    methods: {
      /**
       * Method to add a new chat message. Update
       * 1. push the username, message and timestamp to `chats/sampleChats`
       * 2. set the most recent chat time for this sample to `chats/sampleChatIndex`
       * 3. set that the user has sent a chat for this sample to `chats/userChat/<username>`
       * 4. **TODO**: set that other users following this chat have something new to see.
       */
      sendChat(e) {
        e.preventDefault();
        const key = this.$route.params.key;

        push(ref(this.db, `chats/sampleChats/${key}`), {
          username: this.userData['.key'],
          message: this.chatMessage,
          time: new Date().toISOString(),
        });

        set(ref(this.db, `chats/sampleChatIndex/${key}`), {
          time: new Date().toISOString(),
        });

        set(ref(this.db, `chats/userChat/${this.userData['.key']}/${key}`), {
          watch: 1,
        });

        this.chatMessage = '';

        // add a flag to all other users following this chat.
        const usersToNotify = [];
        this.chatOrder.forEach((v) => {
          if (usersToNotify.indexOf(v.username) < 0 && v.username !== this.userData['.key']) {
            usersToNotify.push(v.username);
          }
        });

        usersToNotify.forEach((u) => {
          set(ref(this.db, `chats/userNotifications/${u}/${key}`), true);
        });
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
      setSampleInfo() {
        // get the chat for this sample
        onValue(ref(this.db, `chats/sampleChats/${this.widgetPointer}`), (snap) => {
          const chatData = snap.val();
          this.chatHistory = chatData;
        });

        // get the user's settings for the widget.
        if (this.userInfo.displayName) {
          onValue(ref(this.db, `userSettings/${this.userInfo.displayName}`), (snap) => {
            this.userSettings = snap.val() || {};
          }, {
            onlyOnce: true,
          });
        }

        // get the widget's summary info
        onValue(ref(this.db, `sampleSummary/${this.widgetPointer}`), (snap) => {
          this.widgetSummary = snap.val();
        });
      },
    },
  };
</script>
