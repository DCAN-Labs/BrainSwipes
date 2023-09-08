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
  border: 1px solid #e3e3e3;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 5px;
  box-shadow: 2px 2px 6px -4px #999;
  cursor: default;
  font-size: 12px;
  pointer-events: none;
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  white-space: nowrap;
  z-index: 12;
  transition: 0.15s ease all;
  padding: 10px;
  text-align: left;
  justify-content: left;
  align-items: center;
  font-family: Helvetica, Arial, sans-serif;
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
    methods: {
      legendMouseOver(n) {
        // eslint-disable-next-line
        this.tip = `${Math.trunc(((this.max - this.min) / this.gradientArray.length) * (n + 1))}${this.label}`;
        this.hidden = false;
      },
      legendMouseOff() {
        this.hidden = true;
      },
    },
  };
</script>