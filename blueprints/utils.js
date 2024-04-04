/* eslint-disable comma-dangle */
// TODO: Extract to config file.

const extractUrl = ({ stringHtml }) => (stringHtml || '').split('"')[1]
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
  const items = []

  for (const item of itemLocators || []) {
    const name = await item.locator('.CardBanner_contentText__7sbfG').textContent()

    const detailContainer = await item.locator('.BlueprintCard_info__em_9K')
    const anchorString = await detailContainer.innerHTML()
    const url = extractUrl({ stringHtml: anchorString })
    items.push({
      id: buildId({ name }),
      name,
      url,
    })
  }

  return items
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

module.exports = {
  getItems,
  getCategories,
  getSubCategories,
  goBack,
}
