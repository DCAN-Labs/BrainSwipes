<template>
  <div class="contact-us">
    <!-- Preferred Contact Method Notice -->
    <h1>Contact Us</h1>

    <section class="form-section">
      <h2>Google form to contact us</h2>
      <p>If you have any questions on issues with your account or are having trouble access specific studies,
        please contact us using the following form.</p>
      <br>
      <b-button
        href="https://docs.google.com/forms/d/1dirzf9j-0s3hBNoEetuvOWAzr8MHkBs3Hexia4BdHOU/edit"
        target="_blank"
        variant="primary"
        class="mb-4"
      >
        Fill Out Contact Form
      </b-button>
    </section>

    <hr class="section-divider" />
    <hr class="section-divider" />

    <!-- Email Contact Section -->
    <section class="form-section">
      <h2>Alternatively, you can send us an email</h2>
      <p>If you have any suggestions. or questions regarding Brainswipes as a whole, please send us an e-mail.</p>
      <br>
      <b-form @submit.prevent="submitForm">
        <b-form-group label="Your Email" label-for="emailInput">
          <b-form-input
            id="emailInput"
            type="email"
            v-model="email"
            :readonly="true"
          />
        </b-form-group>

        <b-form-group label="Subject" label-for="subjectInput">
          <b-form-input
            id="subjectInput"
            v-model="subject"
            required
          />
        </b-form-group>

        <b-form-group label="Message" label-for="bodyInput">
          <b-form-textarea
            id="bodyInput"
            v-model="body"
            rows="5"
            required
          />
        </b-form-group>

        <b-button type="submit" variant="secondary">
          Send Email
        </b-button>
      </b-form>
    </section>
    <hr class="section-divider" />
    <hr class="section-divider" />
    <h2>Github</h2>
    <p>Found a bug or other issue with the app? Post a <a href="https://github.com/DCAN-Labs/BrainSwipes/issues/new" target="_blank">GitHub issue.</a></p>
  </div>
</template>

<script>
export default {
  name: 'ContactUs',
  data() {
    return {
      email: '',
      subject: '',
      body: '',
    };
  },
  created() {
    if (
      this.$root &&
      this.$root.$data &&
      this.$root.$data.user &&
      this.$root.$data.user.email
    ) {
      this.email = this.$root.$data.user.email;
    }
  },
  methods: {
    submitForm() {
      const mailtoLink = `mailto:testbrainswipes@umn.edu?subject=${encodeURIComponent(this.subject)}&body=${encodeURIComponent(this.body + '\n\nFrom: ' + this.email)}`;
      window.location.href = mailtoLink;
    },
  },
};
</script>

<style scoped>
.contact-us {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}
.section-divider {
  margin: 2rem 0;
  border-top: 1px solid #ccc;
}
.form-section h2 {
  margin-bottom: 1rem;
}
</style>
