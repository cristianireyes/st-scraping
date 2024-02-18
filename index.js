// @ts-check
/* eslint-disable comma-dangle */
const { chromium } = require('playwright')

// TODO: Extract to config file.
const baseUrl = 'https://playshoptitans.com'
const blueprintsPageUrl = 'https://playshoptitans.com/blueprints'

const CLASS_MAP = {
  cardItem: '.BlueprintCard_container__VdUlH',
  itemInfo: '.BlueprintCard_info__em_9K',
  category: '.CategorySelector_link__DLxmb',
  subCategory: '.SubCategorySelector_link__EFlmX',
}

const LOCATOR_MAP = {
  subCategories: async ({ page }) => await page.locator(CLASS_MAP.subCategory).all(),
  categories: async ({ page }) => await page.locator(CLASS_MAP.category).all(),
  items: async ({ page }) => await page.locator(CLASS_MAP.cardItem).all(),
}

const extractUrl = ({ stringHtml }) => (stringHtml || '').split('"')[1]
const buildUrl = ({ url }) => `${baseUrl}${url}`
const buildId = ({ name }) => name.toLowerCase().replace(' ', '-')
const buildImage = async ({ imageLocator }) => {
  const url = await imageLocator.getAttribute('src')
  const name = url.split('.')[0].split('%2F').pop()
  const extension = url.split('.')[1].split('&').shift()

  return {
    id: buildId({ name }),
    name,
    url,
    extension,
  }
}

// eslint-disable-next-line no-unused-vars
const goBack = async ({ page }) => {
  const response = await page.goBack({ waitUntil: 'domcontentloaded' })
  const url = await page.url()
  console.log(`[goBack] Navegando hacia ${url}.`)
  return response
}

const getItems = async ({ itemLocators }) => {
  const urls = []

  for (const item of itemLocators || []) {
    const name = await item.locator('.CardBanner_contentText__7sbfG').textContent()

    const detailContainer = await item.locator(CLASS_MAP.itemInfo)
    const anchorString = await detailContainer.innerHTML()
    const url = extractUrl({ stringHtml: anchorString })
    urls.push({
      id: buildId({ name }),
      name,
      url,
    })
  }

  return urls
}

const getCategories = async ({ page, categoryLocators }) => {
  const categories = []

  for (const categoryLocator of categoryLocators || []) {
    const url = await categoryLocator.getAttribute('href')
    const name = await categoryLocator
      .locator('.CategorySelector_name__XxNry')
      .textContent()

    categories.push({
      id: buildId({ name }),
      name,
      url,
    })
  }

  categories.shift() // Remove the first category (Features)

  return categories
}

// TODO: Should receive categories by parameter.
const getSubCategories = async ({ page, subCategoryLocators }) => {
  const subCategories = []

  for (const subCategoryLocator of subCategoryLocators || []) {
    const name = await subCategoryLocator?.getAttribute('title')
    const url = await subCategoryLocator?.getAttribute('href')
    const image = await buildImage({
      imageLocator: await subCategoryLocator.getByAltText(name),
    })

    subCategories.push({
      id: buildId({ name }),
      name,
      url,
      image,
    })
  }

  return subCategories
}

const getItemPages = async ({ page, subCategories }) => {
  const itemPages = []

  for (const subCategory of subCategories.slice(0, 3)) {
    await page.goto(buildUrl({ url: subCategory.url }))

    const url = await page.url()
    console.log(`Extrayendo de ${url}`)

    const items = await getItems({
      itemLocators: await LOCATOR_MAP.items({ page }),
    })

    itemPages.push(items)
  }

  return itemPages.flat()
}

const extractItemInfo = async ({ page }) => {
  console.log(`Extrayendo de ${page.url()}`)

  const name = await page.locator('.Blueprint_itemName__0SARg').textContent()
  const description = await page
    .locator('.Blueprint_itemDescription__xLAdi')
    .textContent()
  const tier = await page.locator('.CardAttribute_tierValue__FHWkO').textContent()

  const resources = await page
    .locator('.Resource_resource__R50XB')
    .all()
    .then(async (resourcesLocators) => {
      const resources = []
      for (const resourceLocator of resourcesLocators) {
        const imageLocator = resourceLocator.getByRole('img')
        const resource = {
          image: {
            name: await imageLocator.getAttribute('alt'),
            url: await buildImage({ imageLocator }),
          },
          name: await imageLocator.getAttribute('alt'),
        }
        resources.push(resource)
      }
      return resources
    })

  const result = {
    name,
    description,
    tier,
    resources,
  }

  return result
}

const bluidBlueprint = async ({ page, categories }) => {
  const blueprints = []
  for (const category of categories.slice(0, 1)) {
    await page.goto(buildUrl({ url: category.url }))

    const subCategoryLocators = await LOCATOR_MAP.subCategories({ page })
    const subCategories = await getSubCategories({ page, subCategoryLocators })
    const items = await getItemPages({ page, subCategories })

    blueprints.push({
      id: category.id,
      category,
      subCategories,
      items,
    })
  }

  return blueprints
}

const getItemPageUrls = ({ blueprints }) => {
  if (!Array.isArray(blueprints)) return []

  return blueprints.map((category) => category.items.map((item) => item.url)).flat()
}

/**
 * Inicio de extracción
 */
;(async () => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto(blueprintsPageUrl)

  // Log
  const startTime = performance.now()
  console.log(`Iniciando extracción en ${page.url()}`)

  // Extraction
  const categoryLocators = await LOCATOR_MAP.categories({ page })
  const categories = await getCategories({ page, categoryLocators })
  const blueprints = await bluidBlueprint({ page, categories })
  const itemPagesUrls = getItemPageUrls({ blueprints })

  const endTime = performance.now()
  console.log(`[Excecution Time]: ${Math.round(endTime - startTime)} ms`)

  /**
   * * Extracción de info de items desde page items
   */

  for (const itemPageUrl of itemPagesUrls.slice(0, 1)) {
    await page.goto(buildUrl({ url: itemPageUrl }))
    const url = await page.url()
    console.log(`Extrayendo de ${url}`)

    const item = await extractItemInfo({ page })

    console.log(item)
  }

  // TODO: Restore after testing implementation.
  // await browser.close()
})()
