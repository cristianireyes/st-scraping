/* eslint-disable comma-dangle */
const { chromium } = require('playwright')

const baseUrl = 'https://playshoptitans.com'
const blueprintsUrl = 'https://playshoptitans.com/blueprints'

const CLASS_MAP = {
  cardItem: '.BlueprintCard_container__VdUlH',
  itemInfo: '.BlueprintCard_info__em_9K',
  category: '.CategorySelector_link__DLxmb',
  subCategory: '.SubCategorySelector_link__EFlmX',
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

const getCategories = async ({ page }) => {
  const categories = []
  const categoryLocators = await page.locator(CLASS_MAP.category).all()

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

// TODO: Por aca!
const getSubCategories = async ({ page }) => {
  const subCategories = []
  const subCategoryLocators = await page.locator(CLASS_MAP.subCategory).all()

  for (const subCategoryLocator of subCategoryLocators || []) {
    const name = await subCategoryLocator.getAttribute('title')
    const url = await subCategoryLocator.getAttribute('href')
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

;(async () => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(blueprintsUrl)
  const urlpage = await page.url()

  console.log(`Iniciando extracciín en ${urlpage}`)

  const pageCategories = []

  const categories = await getCategories({ page })
  for (const category of categories.slice(0, 1)) {
    await page.goto(buildUrl({ url: category.url }))

    const subCategories = await getSubCategories({ page })

    for (const subCategory of subCategories.slice(0, 1)) {
      await page.goto(buildUrl({ url: subCategory.url }))

      const url = await page.url()
      console.log(`Extrayendo de ${url}`)

      const items = await getItems({
        itemLocators: await page.locator(CLASS_MAP.cardItem).all(),
      })

      const pageCategory = { category, subCategory, items }
      pageCategories.push(pageCategory)
    }
  }

  console.log(pageCategories)

  /* const subCategories = await getSubCategories({ page })
  const items = await getItems({ page })
  const itemUrls = await getItems({ items })

  console.log({ categories, subCategories, itemUrls }) */

  // const response = await page.goBack({ waitUntil: 'domcontentloaded' })
  // console.log({ response })
  // const url = await page.url()

  // console.log({ url })

  /* const item = {
    image: await getImage(firstItem),
    name: await getName(firstItem),
    tier: await getTier(firstItem),
  } */

  //await browser.close()
})()
