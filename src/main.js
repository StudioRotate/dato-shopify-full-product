import "babel-polyfill"
import "whatwg-fetch"

import Vue from "vue"

import shopifyProduct from "@/components/shopify-product.vue"

new Vue({
  el: "#app",

  components: {
    shopifyProduct
  },

  template: `<shopifyProduct />`
})
