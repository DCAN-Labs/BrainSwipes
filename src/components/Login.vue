<template name="login">
  <div id="login">
    <h1> Log In </h1>
    <!-- Modal Component -->
    <b-modal id="confirmreset" :title="resetTitle"
      ref="confirmreset" size="lg">
      <p>{{resetStatus}}</p>
      <div slot="modal-footer" class="w-100">
        <b-form @submit="closeDialog">
          <b-button type="submit" variant="primary">Return to Login</b-button>
        </b-form>
      </div>

    </b-modal>

    <div id="signupForm" class="container fluid">
      <b-alert :show="errors.show" variant="danger">{{errors.message}}</b-alert>
      <b-form @submit="onSubmit">
        <b-form-group id="emailAddressInputGroup"
                      label="Email address:"
                      label-for="emailAddress"
                      >
          <b-form-input id="emailAddress"
                        type="email"
                        v-model="form.email"
                        required
                        placeholder="Enter email">
          </b-form-input>
        </b-form-group>


        <b-form-group id="passwordInputGroup"
                      label="Password:"
                      label-for="passwordInput">
          <b-form-input id="passwordInput"
                        type="password"
                        v-model="form.password"
                        required
                        placeholder="Password">
          </b-form-input>
        </b-form-group>


        <b-button type="submit" variant="primary">Submit</b-button>

      </b-form>

      <p class="mt-3">
        Don't have an account? <router-link :to="{ name: 'SignUp', query: routerQuery}">Create one</router-link>
      </p>
      <p class='reset'>
        Forgot password? <b-button @click="resetPassword" id="passwordReset" size="sm" type="submit" variant="primary">Reset it</b-button>
      </p>
    </div>

  </div>
</template>
<style>
#login {
  min-height: 100vh;
}

#passwordReset {
  font-size: 0.6em;
}

.reset {
  margin-top: 0.5em;
}
</style>
<script>
/**
 * The login component for the `/login` route.
 */
  import firebase from 'firebase';

  export default {
    name: 'login',
    props: {
      routerQuery: {
        type: Object,
      },
    },
    data() {
      return {
        /**
         * Elements for the form, with an email and password field.
         */
        form: {
          email: null,
          password: null,
        },
        /**
         * Variable to store errors and their messages.
         */
        errors: {
          show: false,
          message: null,
        },
        resetStatus: '',
        resetTitle: '',
      };
    },
    methods: {
      /**
       * When the user hits submit, we log in with firebase.
       * If its succesful, route the user to the `/play` route.
       * If there is an error, show the message.
       */
      onSubmit(e) {
        e.preventDefault();
        firebase.auth().signInWithEmailAndPassword(this.form.email, this.form.password).then(
                  (user) => {
                    this.$emit('login', user);
                    this.$router.push({ name: 'Home', query: this.routerQuery });
                  },
                  (err) => {
                    this.errors.show = true;
                    this.errors.message = err.message;
                  },
                );
      },
      resetPassword() {
        if(this.form.email) {
          firebase.auth().sendPasswordResetEmail(this.form.email)
            .then(() => {
              this.resetTitle = 'Password Reset';
              this.resetStatus = `A password reset email has been sent to ${this.form.email}`;
              this.$refs.confirmreset.show();
            })
            .catch((error) => {
              this.errors.show = true;
              this.errors.message = error.message;
            });
        } else {
          this.errors.show = true;
          this.errors.message = 'Please enter your email'
        }
      },
      closeDialog(e) {
        e.preventDefault();
        this.$refs.confirmreset.hide();
      }
    },
  };
</script>
