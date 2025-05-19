<template>
  <div class="contact-us">
    <!-- Preferred Contact Method Notice -->
    <h1>Contact Us</h1>

    <section class="form-section">
      <h2>Google form to contact us</h2>
      <p>If you are having any issues with your account (including having trouble accessing specific studies)
        or have suggestions for how we can make Brainswipes better,
        please contact us using the following form.</p>
      <br>
      <b-button
        href="https://docs.google.com/forms/d/e/1FAIpQLSfLUOPkuKYdhYRZ8nJG4kQkhhyaZ_YEFtHops8p2fu_-zOYiA/viewform?usp=header"
        target="_blank"
        variant="primary"
        class="mb-4"
      >
        Fill Out Contact Form
      </b-button>
    </section>

    <hr class="section-divider" />
    <hr class="section-divider" />

    <section class="form-section">
      <h2>Google form to report a bug</h2>
      <p>If you are experiencing any errors or bugs using BrainSwipes, 
        please fill out the following form.</p>
      <br>
      <b-button
        href="https://docs.google.com/forms/d/e/1FAIpQLScQoQbG9QXM6ExMIxqgcbBM0N9TIssCo6VoR-pCSSrbYRlk1g/viewform?usp=sf_link"
        target="_blank"
        variant="primary"
        class="mb-4"
      >
        Fill Out Bug Form
      </b-button>
    </section>

    <hr class="section-divider" />
    <hr class="section-divider" />

    <h2>Github to report a bug</h2>
    <p>Alternatively, if you found a bug or other issue with the app you can post a <a href="https://github.com/DCAN-Labs/BrainSwipes/issues/new" target="_blank">GitHub issue.</a></p>

    <hr class="section-divider" />
    <hr class="section-divider" />

    <h2>New Study</h2>
    <p>If you would like to have your study on BrainSwipes, please fill out <a href="https://docs.google.com/forms/d/e/1FAIpQLSeSKbvCryYDvb9cX8ENLne5Xk8VlUlMDR-3ZjVbtqVy46ycvw/viewform?usp=sf_link" target="_blank">this new study ingestion form.</a></p>
  </div>
</template>


<script>
export default {
  name: 'ContactUs',
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      email: '',
      subject: '',
      body: '',
      copied: '',
    };
  },
  created() {
    if (this.userInfo && this.userInfo.email) {
      this.email = this.userInfo.email;
    }
  },
  methods: {
    submitForm() {
      const recipients = [
        'mend0130@umn.edu',
        'joanmem@gmail.com',
      ];
      const mailtoLink = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(this.subject)}&body=${encodeURIComponent(`${this.body}\n\nFrom: ${this.email}`)}`;

      window.location.href = mailtoLink;
    },
    copyEmail(email) {
      navigator.clipboard.writeText(email).then(() => {
        this.copied = email;
        setTimeout(() => {
          this.copied = '';
        }, 1500);
      });
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
.copied {
  margin-left: 0.5rem;
  color: green;
  font-weight: bold;
}
</style>
