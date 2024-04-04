const fs = require('fs')
const { BASE_URL } = require('./constants')

/* eslint-disable comma-dangle */
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

const getDetailUrl = async (elementHandle) => {
  console.log({ elementHandle })
  const container = await elementHandle.locator('.BlueprintCard_info__em_9K')
  console.log({ container: await container.locator.innerHTML() })
  const url = container.getAttribute('href')
  return url
}

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

const measureExecutionTime = async ({ fn }) => {
  const startTime = performance.now()
  await fn()
  const endTime = performance.now()

  return {
    message: `Call to doSomething took ${endTime - startTime} milliseconds`,
    time: endTime - startTime,
  }
}

const buildUrl = ({ url }) => `${BASE_URL}${url}`
const getLocators = async (page, selector) => await page.locator(selector).all()
const writeFile = async ({ path, data }) =>
  new Promise(function (resolve, reject) {
    fs.writeFile(path, JSON.stringify(data, null, 2), function (err) {
      if (err) reject(err)
      else resolve(data)
    })
  })

module.exports = {
  getName,
  getTier,
  getDetailUrl,
  getImage,
  measureExecutionTime,
  buildUrl,
  getLocators,
  writeFile,
}
