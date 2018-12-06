<template>
  <div class="shopify-product">
    <form class="shopify-product__form">
      <div v-if="currentProduct">
        <p class="shopify-product__label">Selected</p>
        <ul class="shopify-product__list shopify-product__list--selected">
          <li class="shopify-product__item">
            <label
              :for  = "`product-${currentProduct.id}`"
              class = "shopify-product__item-label">
              <img
                :alt  = "currentProduct.images[0] ? currentProduct.images[0].altText : ''"
                :src  = "currentProduct.images[0] ? getSmallImageUrl(currentProduct.images[0].originalSrc) : ''"
                class = "shopify-product__image">
              <span class="shopify-product__title">{{ currentProduct.title.toLowerCase() }}</span>
            </label>
          </li>
          <li class="shopify-product__item">
            <table
              v-if  = "extraVariantFields"
              class = "shopify-product__table">
              <thead>
                <tr>
                  <td>variant</td>
                  <td
                    v-for = "(heading, index) in extraVariantFields"
                    :key  = "index">{{ heading }}</td>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for = "(variant, vindex) in getProductsVariants"
                  :key  = "vindex">
                  <td>{{ variant.title }}</td>
                  <td
                    v-for = "(value, heading) in getExtraDetails(variant)"
                    :key  = "heading">
                    <label
                      :for  = "`frm-ed-${vindex}-${heading}`"
                      class = "shopify-product__label accessible-hidden">{{ variant.title }} {{ value }} value</label>
                    <input
                      :id    = "`frm-ed-${vindex}-${heading}`"
                      :name  = "heading"
                      :value = "value"
                      class  = "shopify-product__input shopify-product__input--table-text"
                      type   = "text"
                      @blur  = "setExtraDetail($event, variant)"
                      @keyup = "setExtraDetail($event, variant)">
                  </td>
                </tr>
              </tbody>
            </table>
          </li>
        </ul>
        <hr class="shopify-product__hr">
      </div>
      <label
        class = "shopify-product__label"
        for   = "frm-store">
        Store
      </label>
      <select
        class   = "shopify-product__select"
        name    = "store"
        id      = "frm-store"
        v-model = "currentShopifyStore">
        <option></option>
        <option
          v-for  = "(store, index) in shopifyStores"
          :key   = "index"
          :value = "store">
          {{ store.storeCountry }}
        </option>
      </select>
      <label
        class = "shopify-product__label"
        for   = "frm-search">
        Search
      </label>
      <input
        v-model   = "searchTerm"
        :disabled = "!searchTermEnabled"
        class     = "shopify-product__input shopify-product__input--text"
        type      = "text"
        name      = "search"
        id        = "frm-search">
      <div v-if="currentShopifyStoreProducts">
        <hr class="shopify-product__hr">
        <p class="shopify-product__label">Results</p>
        <ul class="shopify-product__list">
          <li
            v-for  = "(product, index) in currentShopifyStoreProducts"
            :key   = "index"
            :class = "['shopify-product__item', { 'is-selected': product.id === currentProduct.id, 'is-hidden': !isSearchTermInTitle(searchTerm, product.title) }]">
            <input
              v-model = "currentProduct"
              :id     = "`product-${product.id}`"
              :value  = "product"
              class   = "shopify-product__input shopify-product__input--radio"
              name    = "product"
              type    = "radio">
            <label
              :for  = "`product-${product.id}`"
              class = "shopify-product__item-label">
              <img
                :alt  = "product.images[0] ? product.images[0].altText : ''"
                :src  = "product.images[0] ? getSmallImageUrl(product.images[0].originalSrc) : ''"
                class = "shopify-product__image">
              <span class="shopify-product__title">{{ product.title.toLowerCase() }}</span>
              <div class="shopify-product__tick">
                <span class="shopify-product__tick-label accessible-hidden">selected</span>
                <span class="shopify-product__tick-icon">✓</span>
              </div>
            </label>
          </li>
        </ul>
      </div>
    </form>
  </div>
</template>

<script>
  const DatoCmsPlugin = require("datocms-plugins-sdk")

  export default {
    name: "ShopifyProduct",

    data() {
      return {
        currentProduct: false,
        currentShopifyStore: false,
        currentShopifyStoreProducts: false,
        dato: false,
        extraVariantFields: false,
        searchTerm: "",
        searchTermEnabled: false,
        shopifyStores: false
      }
    },

    computed: {
      getProductsVariants() {
        let value = []

        if (this.currentProduct) {
          value = this.currentProduct.variants
        }

        return value
      }
    },

    watch: {
      async currentProduct() {
        await this.setProductInDato(this.currentProduct)
      },

      async currentShopifyStore() {
        // give user indication as to what's happening
        this.searchTerm = "Loading: Please wait..."
        this.searchTermEnabled = false

        // fecth products from shopify
        const response = await this.getProducts()

        // if response is how we need it
        const products = response && response.data && response.data.shop && response.data.shop.products ? response.data.shop.products.edges : false

        if (products) {
          // store all returned products locally in module
          this.currentShopifyStoreProducts = this.getProductsClean(products)

          // if extra variant details degined in plugin paramters from cms, apply defined keys and default values
          if (this.extraVariantFields) {
            this.currentShopifyStoreProducts = this.getProductsExtraDetails(this.currentShopifyStoreProducts)
          }

          // clear search input to let user know they can now search results
          this.searchTerm = ""
          this.searchTermEnabled = true
        }
      }
    },

    async beforeMount() {
      // store dato sdk for global use in module
      this.dato = await DatoCmsPlugin.init()

      // get plugin paramters from cms
      const shopifyConfig = JSON.parse(this.dato.parameters.global.shopifyConfig)

      this.shopifyStores = shopifyConfig.shopifyStores
      this.extraVariantFields = shopifyConfig.extraVariantFields

      // UNCOMMENT FOR LOCAL TESTING ONLY (comment above lines within beforeMount)
      //------------------------------------------------------------------------
      // const local = {
      //   "shopifyStores": [
      //     {
      //       "storeCountry": "eu",
      //       "storeDomain": "DOMAIN.myshopify.com",
      //       "storeAccessToken": "TOKEN"
      //     },
      //     {
      //       "storeCountry": "uk",
      //       "storeDomain": "DOMAIN.myshopify.com",
      //       "storeAccessToken": "TOKEN"
      //     },
      //     {
      //       "storeCountry": "us",
      //       "storeDomain": "DOMAIN.myshopify.com",
      //       "storeAccessToken": "TOKEN"
      //     }
      //   ],
      //   "extraVariantFields": [
      //     "swatch",
      //     "image_1",
      //     "image_2",
      //     "image_3",
      //     "image_4"
      //   ]
      // }

      // this.shopifyStores = local.shopifyStores
      // this.extraVariantFields = local.extraVariantFields
      //------------------------------------------------------------------------

      // get previously stored value if one exists
      const currentValueJson = await this.dato.getFieldValue("shopify_product")

      // if previsouly stored value exists
      if (currentValueJson) {
        // if using dato cms locales, pick the right locale string
        if (this.dato.field.attributes.localized) {
          // catch when adding new locale to entry and field object doesn't have locale key or value yet
          if (currentValueJson[this.dato.locale]) {
            this.currentProduct = JSON.parse(currentValueJson[this.dato.locale])
          }
        } else {
          this.currentProduct = JSON.parse(currentValueJson)
        }
      }

      // attach dato height resizer dom listener
      this.dato.startAutoResizer()
    },

    methods: {
      isSearchTermInTitle(searchTerm, title) {
        return title.toLowerCase().includes(searchTerm.toLowerCase())
      },

      getExtraDetails(variant) {
        let value = {}

        if (variant.extraDetails && this.extraVariantFields) {
          this.extraVariantFields.forEach(field => {
            value[field] = variant.extraDetails[field]
          })
        }

        return value
      },

      async getProducts() {
        if (this.currentShopifyStore) {
          const response = await window.fetch(`https://${this.currentShopifyStore.storeDomain}/api/graphql`, {
            body: `
                  {
                    shop {
                      name
                      products(first:250) {
                          edges {
                              node {
                                availableForSale
                                collections(first:10) {
                                  edges {
                                    node {
                                      handle
                                      description
                                      title
                                    }
                                  }
                                }
                                createdAt
                                description
                                handle
                                id
                                images(first:1) {
                                  edges {
                                    node {
                                      altText
                                      id
                                      originalSrc
                                      transformedSrc
                                    }
                                  }
                                }
                                onlineStoreUrl
                                priceRange {
                                  maxVariantPrice {
                                    amount
                                    currencyCode
                                  }
                                  minVariantPrice {
                                    amount
                                    currencyCode
                                  }
                                }
                                productType
                                publishedAt
                                tags
                                title
                                updatedAt
                                vendor
                                variants(first:10) {
                                  edges {
                                    node {
                                      availableForSale
                                      compareAtPrice
                                      id
                                      image {
                                        altText
                                        id
                                        originalSrc
                                        transformedSrc
                                      }
                                      price
                                      sku
                                      title
                                      weight
                                      weightUnit
                                    }
                                  }
                              }
                            }
                        }
                      }
                    }
                  }
                  `,
            headers: {
              "X-Shopify-Storefront-Access-Token": this.currentShopifyStore.storeAccessToken,
              "Content-Type": "application/graphql"
            },
            method: "POST"
          })

          return await response.json()
        }
      },

      getProductsClean(products) {
        const _products = []

        products.forEach(product => {
          if (product.node.collections.edges && product.node.collections.edges.length > 0) {
            const collectionValues = []

            product.node.collections.edges.forEach(collection => {
              const _collection = {
                description: collection.node ? collection.node.description : "",
                handle: collection.node ? collection.node.handle : "",
                title: collection.node ? collection.node.title : ""
              }

              return collectionValues.push(_collection)
            })

            product.node.collections = collectionValues
          }

          if (product.node.images.edges && product.node.images.edges.length > 0) {
            const imageValues = []

            product.node.images.edges.forEach(image => {
              const _image = {
                altText: image.node ? image.node.altText : "",
                id: image.node ? image.node.id : "",
                originalSrc: image.node ? image.node.originalSrc : "",
                transformedSrc: image.node ? image.node.transformedSrc : ""
              }

              return imageValues.push(_image)
            })

            product.node.images = imageValues
          }

          if (product.node.variants.edges && product.node.variants.edges.length > 0) {
            const valuesVariant = []

            product.node.variants.edges.forEach(variant => {
              const _variant = {
                availableForSale: variant.node ? variant.node.availableForSale : "",
                compareAtPrice: variant.node ? variant.node.compareAtPrice : "",
                id: variant.node ? variant.node.id : "",
                image: variant.node ? variant.node.image : "",
                price: variant.node ? variant.node.price : "",
                sku: variant.node ? variant.node.sku : "",
                title: variant.node ? variant.node.title : "",
                weight: variant.node ? variant.node.weight : "",
                weightUnit: variant.node ? variant.node.weightUnit : ""
              }

              return valuesVariant.push(_variant)
            })

            product.node.variants = valuesVariant
          }

          _products.push(product.node)
        })

        return _products
      },

      getProductsExtraDetails(products) {
        products.forEach(product => {
          product.variants.forEach(variant => {
            this.extraVariantFields.forEach(field => {
              if (variant.extraDetails) {
                variant.extraDetails[field] = ""
              } else {
                variant.extraDetails = {}
                variant.extraDetails[field] = ""
              }
            })
          })
        })

        return products
      },

      getSmallImageUrl(url) {
        let value = ""

        // edit url to obtain smaller files for thumbnails
        if (url) {
          value = url.replace(/\.(gif|jpg|jpeg|png)\?v=(.*)/, "_150x150.$1")
        }

        return value
      },

      async setExtraDetail(event, variant) {
        if (event.target.name && event.target.value && variant.extraDetails) {
          variant.extraDetails[event.target.name] = event.target.value

          await this.setProductInDato(this.currentProduct)
        }
      },

      async setProductInDato(product) {
        // if previsouly stored value exists
        const currentValueJson = await this.dato.getFieldValue("shopify_product")

        if (currentValueJson) {
          // if using dato cms locales, pick the right locale string
          if (this.dato.field.attributes.localized) {
            // store new selected product in dato field only if it's not already stored
            if (currentValueJson[this.dato.locale] !== JSON.stringify(product)) {
              await this.dato.setFieldValue("shopify_product", this.dato.locale, JSON.stringify(product))
            }
          } else {
            // store new selected product in dato field only if it's not already stored
            if (currentValueJson !== JSON.stringify(product)) {
              await this.dato.setFieldValue("shopify_product", JSON.stringify(product))
            }
          }
        } else {
          // store new selected product in dato field only if it's not already stored
          if (currentValueJson !== JSON.stringify(product)) {
            await this.dato.setFieldValue("shopify_product", JSON.stringify(product))
          }
        }
      }
    }
  }
</script>

<style>
  .shopify-product__form {
    border-left: 1px solid #f0f0f0;
    padding-left: 20px;
  }

  .shopify-product__hr {
    margin: 20px 0;
  }

  .shopify-product__image {
    height: 150px;
    object-fit: cover;
    width: 100%;
  }

  .shopify-product__input--text {
    font-size: 14px;
    width: auto;
  }

  .shopify-product__input--table-text {
    background: transparent;
    border: none;
    font-size: 14px;
    height: 100%;
    margin: 0;
    padding: 5px 0;
    width: 100%;
  }

  .shopify-product__input--radio {
    display: none;
  }

  .shopify-product__item {
    box-shadow: 1px 1px 10px 0px rgba(0, 0, 0, 0.1);
    height: 250px;
    margin: 10px;
    overflow: hidden;
    transition: box-shadow 200ms ease-out, transform 200ms ease-out;
    width: 150px;
  }

  .shopify-product__item:hover,
  .shopify-product__item.is-selected {
    box-shadow: 1px 5px 10px 0px rgba(0, 0, 0, 0.2);
  }

  .shopify-product__list--selected .shopify-product__item:first-child {
    flex-shrink: 0;
  }

  .shopify-product__list--selected .shopify-product__item + .shopify-product__item {
    box-shadow: none;
    flex-grow: 1;
    height: auto;
    width: auto;
  }

  .shopify-product__item-label {
    display: block;
    height: 100%;
    position: relative;
  }

  .shopify-product__item-label:hover {
    cursor: pointer;
  }

  .shopify-product__label {
    display: block;
    font-size: 15px;
    margin: 20px 0 5px 0;
    display: block;
    color: #848484;
    position: relative;
  }

  .shopify-product__list {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    padding: 0;
    margin: -10px;
  }

  .shopify-product__list--selected {
    flex-wrap: nowrap;
  }

  .shopify-product__select {
    font-size: 14px;
  }

  .shopify-product__table {
    border-collapse: collapse;
    border-spacing: 0;
    width: 100%;
  }

  .shopify-product__table thead td {
    border-bottom: 1px solid #f0f0f0;
    font-weight: bold;
    font-size: 14px;
    text-transform: capitalize;
  }

  .shopify-product__table tr:nth-child(even) {
    background-color: #f0f0f0;
  }

  .shopify-product__table td {
    border-left: 1px solid #f0f0f0;
    overflow: hidden;
    padding: 0 0 0 5px;
    text-overflow: ellipsis;
  }

  .shopify-product__table td:first-child {
    border-left: none;
  }

  .shopify-product__tick {
    display: none;;
    position: absolute;
    bottom: 10px;
    right: 10px;
  }

  .shopify-product__item.is-selected .shopify-product__tick {
    display: block;
  }

  .shopify-product__tick-icon {
    align-items: center;
    background-color: #61bd4f;
    border-radius: 50%;
    color: #fff;
    display: flex;
    font-size: 20px;
    height: 15px;
    justify-content: center;
    overflow: hidden;
    padding: 10px;
    width: 15px;
  }

  .shopify-product__tick-label {
    border: 0 !important;
    clip: rect(0 0 0 0) !important;
    height: 1px !important;
    margin: -1px !important;
    overflow: hidden !important;
    padding: 0 !important;
    position: absolute !important;
    width: 1px !important;
  }

  .shopify-product__title {
    display: block;
    font-size: 14px;
    padding: 10px;
    text-transform: capitalize;
  }

  .accessible-hidden {
    border: 0 !important;
    clip: rect(0 0 0 0) !important;
    height: 1px !important;
    margin: -1px !important;
    overflow: hidden !important;
    padding: 0 !important;
    position: absolute !important;
    width: 1px !important;
  }

  .is-hidden {
    display: none;
  }
</style>
