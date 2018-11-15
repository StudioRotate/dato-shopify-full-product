import "babel-polyfill"

import Vue from "vue"

import shopifyProduct from "@/component/shopify-product.vue"

new Vue({
  el: "#app",

  components: {
    shopifyProduct
  },

  template: `
    <shopifyProduct />
  `
})
