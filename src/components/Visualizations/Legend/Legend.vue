<template>
  <div id="legend">
    <svg width="20" height="200">
      <rect v-for="(color, index) in gradientArray" :key="color" @mouseover="legendMouseOver(index)" @mouseout="legendMouseOff()" :y="(gradientArray.length - index - 1) * 10" :x="(gradientArray.length - index) / 2" :width="(index + 1)" height="10" :style="{fill:color}" />
    </svg>
    <div id="legend-tooltip" ref="legendtooltip" v-show="!hidden">
      {{tip}}
    </div>
  </div>
</template>

<style scoped>
#legend-tooltip {
  position: absolute;
  background: white;
  border: 1px solid grey;
  z-index: 1;
}
</style>

<script>
  export default {
    name: 'Legend',
    data() {
      return {
        hidden: true,
        tip: '',
      };
    },
    props: {
      /**
       * Color palette
       */
      gradientArray: {
        type: Array,
        required: true,
      },
      /**
       * Extent of data
       */
      max: {
        type: Number,
        required: true,
      },
      min: {
        type: Number,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
    },
    created() {
      // this.moveTooltip();
    },
    methods: {
      legendMouseOver(n) {
        // eslint-disable-next-line
        this.tip = `${Math.trunc(((this.max - this.min) / this.gradientArray.length) * (n + 1))}${this.label}`;
        this.hidden = false;
      },
      legendMouseOff() {
        this.hidden = true;
      },
      moveTooltip() {
        document.addEventListener('mousemove', function(e) {
          let body = document.querySelector('body');
          let tooltip = document.getElementById('legend');
          let left = e.clientX;
          let top = e.clientY;
          tooltip.style.left = left + 'px';
          tooltip.style.top = top + 'px';
        });
      }
    },
  };
</script>