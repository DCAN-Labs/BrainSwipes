<template name="gallery">
  <div id="gallery" class="container">
    <!-- Title -->
    <div>
      <h1>Gallery of Advanced Cases</h1>
      <p class="lead">Get expert advice on difficult samples.</p>
      <p>Have something you want added? Flag it by clicking the Help button.</p>
      <hr>
    </div>
    <div>
      <div class="gallery-item" v-for="sample in Object.keys(gallery)" :key="sample">
        <div :class="gallery[sample].hidden ? 'hidden-item' : ''">
          <div v-if="gallery[sample].hidden" class="gallery-form-wrapper">
            <div class="gallery-form">
              <b-form>
                <b-form-group
                  id="input-group-1"
                  label="Issue Label:"
                  label-for="input-1"
                  description="A breif description of the issue, the title of the gallery entry."
                >
                  <b-form-input
                    id="input-1"
                    v-model="form[sample].label"
                    placeholder="Enter issue label"
                    required
                  ></b-form-input>
                </b-form-group>
                <b-form-group
                  id="input-group-2"
                  label="Issue Description:"
                  label-for="input-1"
                  description="A full description of the issue including rational for why this image passes or fails."
                >
                  <b-form-input
                    id="input-2"
                    v-model="form[sample].text"
                    placeholder="Enter full issue description"
                    required
                  ></b-form-input>
                </b-form-group>
                <b-form-group label="Does the sample Pass or Fail?">
                  <b-form-radio-group
                    id="radio-group-1"
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
                  />
                </div>
                <br>
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

</style>

<script>
/**
 * TODO: fill this in.
 */
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
      };
    },
    props: {
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
       * The firebase database
       */
      db: {
        type: Object,
        required: true,
      },
    },
    computed: {
      /**
       * dataset that the tutorial images are from
       */
      tutorialDataset() {
        return this.config.learn.tutorial.dataset;
      },
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
        this.form[sample].hidden = false;
        this.db.ref(`config/learn/gallery/${sample}`).set(this.form[sample]);
      },
      onReset(sample) {
        this.form[sample] = this.config.learn.gallery[sample];
      },
      copyGalleryConfig() {
        const copy = JSON.parse(JSON.stringify(this.config.learn.gallery));
        this.form = copy;
      },
    },
    mounted() {
      this.copyGalleryConfig();
    },
  };
</script>
