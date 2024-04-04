const { chromium } = require('playwright')
const { BASE_URL } = require('../constants')
const { getLocators, writeFile } = require('../utils')
const { getCategories, getSubCategories, getItems } = require('./utils')

const PAGES = {
  home: '/',
  blueprints: '/blueprints'
}

const CLASS_MAP = {
  cardItem: '.BlueprintCard_container__VdUlH',
  itemInfo: '.BlueprintCard_info__em_9K',
  category: '.CategorySelector_link__DLxmb',
  subCategory: '.SubCategorySelector_link__EFlmX'
}

const Locators = {
  subCategories: {
    get: async ({ page }) => await getLocators(page, CLASS_MAP.subCategory)
  },
  categories: {
    get: async ({ page }) => await getLocators(page, CLASS_MAP.category)
  },
  items: {
    get: async ({ page }) => await getLocators(page, CLASS_MAP.cardItem)
  }
}

const getBlueprints = async ({ page }) => {
  const categoryLocators = await Locators.categories.get({ page })
  const categories = await getCategories({ page, categoryLocators })

  const blueprints = []
  for (const category of categories) {
    await page.goto(category.url)

    const subCategoryLocators = await Locators.subCategories.get({ page })
    const subCategories = await getSubCategories({ page, subCategoryLocators })
    const items = []

    // starts from the second subcategory
    for (const subCategory of subCategories.slice(1)) {
      await page.goto(subCategory.url)
      console.log(`Extrayendo de ${subCategory.url}`)

      const itemLocators = await Locators.items.get({ page })
      const subCategoryItems = await getItems({
        itemLocators
      })

      items.push(
        subCategoryItems.map((item) => ({
          ...item,
          categoryId: category.id,
          subCategoryId: subCategory.id
        }))
      )
    }

    blueprints.push({
      id: category.id,
      category,
      subCategories,
      items: items.flat()
    })
  }

  return blueprints
}

/**
 * Inicio de extracción
 */
;(async () => {
  try {
    const browser = await chromium.launch({ headless: false, timeout: 60000 })
    const page = await browser.newPage({ baseURL: BASE_URL })

    await page.goto(PAGES.blueprints)

    // Log
    const startTime = performance.now()
    console.log(`Iniciando extracción en ${page.url()}`)

    // Extraction
    const blueprints = await getBlueprints({ page })
    const categories = blueprints.map((category) => category.category)
    const subCategories = blueprints
      .map((category) =>
        category.subCategories.map((subCategories) => ({
          ...subCategories,
          categoryId: category.id
        }))
      )
      .flat()
    const items = blueprints.map((category) => category.items).flat()

    await writeFile({
      path: 'data/blueprints.json',
      data: blueprints
    })
    await writeFile({
      path: 'data/categories.json',
      data: categories
    })
    await writeFile({
      path: 'data/sub-categories.json',
      data: subCategories
    })
    await writeFile({
      path: 'data/items.json',
      data: items
    })

    const endTime = performance.now()
    console.log(`[Excecution Time]: ${Math.round(endTime - startTime)} ms`)

    await browser.close()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
