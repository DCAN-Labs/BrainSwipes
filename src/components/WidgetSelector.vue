<template>
  <div class="WidgetSelector">
    <ImageSwipe
    ref="ImageSwipe"
    :widgetPointer="widgetPointer"
    :widgetSummary="widgetSummary"
    :tutorialStep="tutorialStep"
    v-on:widgetRating="widgetRating"
    :playMode="playMode"
    :dataset="dataset"
    :bucket="bucket"
    :catchDataset="catchDataset"
    :catchBucket="catchBucket"
    :identifier="identifier"
    />
  </div>
</template>

<script>
/**
 * This a "switch" component, it displays whatever widget is
 * passed from the parent prop. It is also a proxy for any events emited from
 * the specific widget to the parent.
 */
  import ImageSwipe from './Widgets/ImageSwipe';

  export default {
    name: 'WidgetSelector',
    props: {
       /**
        * The sample ID to tell the widget to display.
        */
      widgetPointer: {
        type: String,
        required: true,
      },
      /**
       * The summary data for the widget.
       * This could keep track of the running average, for example.
       */
      widgetSummary: {
        type: Object,
        required: false,
      },
      /**
       * Tells the widget if it should be in a "play mode" or maybe a "review mode".
       */
      playMode: {
        type: String,
        required: false,
      },
      /**
       * Tells the widget to display a tutorial step.
       * Could be like highlighting a certain button.
       */
      tutorialStep: {
        type: Number,
        required: false,
      },
      /**
       * the dataset to swipe on
       */
      dataset: {
        type: String,
        required: true,
      },
      /**
       * the s3 bucket where the images for the dataset are held
       */
      bucket: {
        type: String,
        required: true,
      },
      /**
       * config for the catch trials
       */
      catchBucket: {
        type: String,
        required: false,
      },
      catchDataset: {
        type: String,
        required: false,
      },
      /**
       * id for tutorial images
       */
      identifier: {
        type: String,
        required: false,
      },
    },
    components: {
      ImageSwipe,
    },
    methods: {
      /**
       * proxy the widget's getFeedback method.
       */
      getFeedback(response) {
        return this.$refs.ImageSwipe.getFeedback(response);
      },
      /**
       * proxy the widget's getScore method.
       */
      getScore(response) {
        return this.$refs.ImageSwipe.getScore(response);
      },
      /**
       * proxy the widget's getSummary method.
       */
      getSummary(response) {
        return this.$refs.ImageSwipe.getSummary(response);
      },
      /**
       * emit the widget's response to the parent.
       */
      widgetRating(response) {
        this.$emit('widgetRating', response);
      },
    },
  };
</script>

<style>

</style>
