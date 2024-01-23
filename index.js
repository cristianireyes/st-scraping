/* eslint-disable comma-dangle */
const { chromium } = require('playwright')

const baseUrl = 'https://playshoptitans.com/blueprints/weapons/ws'

const getImage = async (elementHandle) => {
  const imageContainer = await elementHandle.$('.ItemImage_image__T2t6L')
  const image = await imageContainer.$('img')
  // /_next/image?url=%2Fassets%2Fitems%2Fplatinumroguehat.png&w=640&q=50
  const url = await image.getAttribute('src')
  const name = url.split('.')[0].split('%2F').pop()
  const extension = url.split('.')[1].split('&').shift()

  return {
    url,
    name,
    extension,
  }
}

const getName = async (elementHandle) => {
  const container = await elementHandle.$('.CardBanner_contentText__7sbfG')
  const name = container.textContent()
  return name
}
const getTier = async (elementHandle) => {
  const container = await elementHandle.$('.CardAttribute_tierValue__FHWkO')
  const tier = container.textContent()
  return tier
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(baseUrl)

  const items = await page.$$('.BlueprintCard_container__VdUlH')

  /*   const itemMapper = async (element) => {
    const image = await element.getAttribute('src')

    const name = await element.$('.BlueprintCard_name__3Xf9d')
    // const image = await element.$('.BlueprintCard_image__3a8Y-')
    const level = await element.$('.BlueprintCard_level__2zj8P')
    const rarity = await element.$('.BlueprintCard_rarity__1Z4l4')
    const type = await element.$('.BlueprintCard_type__2Q2wC')
    const description = await element.$('.BlueprintCard_description__1gJ9a')
    const ingredients = await element.$('.BlueprintCard_ingredients__1gJ9a')
    const stats = await element.$('.BlueprintCard_stats__1gJ9a')
    const requirements = await element.$('.BlueprintCard_requirements__1gJ9a')
    const effects = await element.$('.BlueprintCard_effects__1gJ9a')
    const source = await element.$('.BlueprintCard_source__1gJ9a')
    const notes = await element.$('.BlueprintCard_notes__1gJ9a')

    return {
      name: await name.innerText(),
      image: await image.innerText(),
      level: await level.innerText(),
      rarity: await rarity.innerText(),
      type: await type.innerText(),
      description: await description.innerText(),
      ingredients: await ingredients.innerText(),
      stats: await stats.innerText(),
      requirements: await requirements.innerText(),
      effects: await effects.innerText(),
      source: await source.innerText(),
      notes: await notes.innerText(),
    }
  } */

  // const items = await page.locator('.BlueprintCard_container__VdUlH').all()

  const firstItem = items[0]

  const item = {
    image: await getImage(firstItem),
    name: await getName(firstItem),
    tier: await getTier(firstItem),
  }

  // console.log(await getImage(firstItem))

  // await page.screenshot({ path: 'screenshots/example.png' })

  console.log(item)

  await browser.close()
})()
