import { ROOMS_DB } from "./firebase"

/**
 * Generates all the possible combination of children.
 * If there is an old price, it is not overriden, otherwise it is 0
 * @param {object} old the old node to check for existing prices
 * @param {number} maxChildren the maximum number of children
 * @returns {object} the new pricing, with preserved pricing from the previous state
 */

const childCombinations = (old, maxPeople, children) => {
  let combinations = {}
  let combination = Array(children).fill("6-12").join("_")
  const length = combination.length - 1
  combination = combination[length] === "_" ? combination.slice(0, length) : combination
  if (combination === "" && children === 0) {
    combinations = {
      name: `${maxPeople} felnőtt`,
      price: old.price || 0
    }
  } else {
    combinations = old[combination] || {
      price: 0,
      name: `${maxPeople} felnőtt, ${combination.split("_").length} gyerek (6-12)`
    }
  }
  return combinations
}


/**
 * Generates a price table for a room, without overriding previously set prices.
 * @param {object} old the old pricing
 * @param {number} maxPeople maximum number of adults
 */
const generatePrices = (old, maxPeople) => {
  const table = {}
  for (let adults = 1; adults <= maxPeople; adults++) {
    const adultGroup = {}
    for (let children = 0; children <= maxPeople - 1; children++) {
      if (adults + children <= maxPeople) {
        const oldPrice = old && old[adults] && old[adults][children] ? old[adults][children] : {}
        adultGroup[children] = childCombinations(oldPrice, adults, children)
      }
    }
    table[adults] = adultGroup
  }
  return table
}




export async function populate(change, {params: {roomId}}) {
  const maxPeople = change.after.val()
  const priceTableRef = ROOMS_DB.child(`${roomId}/prices/table`)
  const oldPrices = await (await priceTableRef.once("value")).val()

  return Promise.all(
    Object.entries(oldPrices)
    .map(([foodService, oldValues]) =>
      priceTableRef
        .child(foodService)
        .set(generatePrices(oldValues, maxPeople))
    )
  )
}


export function calculateMinPrices(change, {params: {roomId}}) {
  let minPrice = Infinity
  const priceTable = change.after.val()
  Object.entries(priceTable).forEach(([_, value ]) => {
    Object.entries(value).forEach(([adult, value]) => {
      Object.entries(value).forEach(([children, {price}]) => {
        const headCount = parseInt(adult, 10) + parseInt(children, 10)
        const pricePerPerson = Math.round(price / headCount)
        if (pricePerPerson < minPrice) {
          minPrice = pricePerPerson
        }
      })
    })
  })
  return ROOMS_DB.child(`${roomId}/prices/metadata/minPrice`).set(minPrice)
}