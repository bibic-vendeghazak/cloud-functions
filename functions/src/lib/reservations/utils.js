import moment from "../moment"
import { RESERVATION_DATES_DB } from "../firebase"



/**
 * use when an update (create/change/delete) occurs on a reservation.
 * @param {Timestamp} from first date to check
 * @param {Timestamp} to last date to check
 * @param {array} roomIds which rooms should be checked
 * @param {string} reservationId which reservation changed
 * @param {boolean} [shouldDelete=false] is it a delete operation?
 * @param {boolean} [compare=] has arrival, departure or roomId changed?
 * @returns {Promise}
 */
export function updateReservationDates(from, to, roomIds, reservationId, shouldDelete=false) {
  // convert from Firebase Timestamp
  from = moment(from.toDate())
  to = moment(to.toDate())


  /* iterate over all the dates from arrival to departure
   * REVIEW: an extra day must be added to "to" date for it to work
   */
  const reservations = Array.from(moment.range(from, to.clone().add(1, "day")).by("day"))
    .map(day => ({
        reservation: !shouldDelete ? {
          from: day.isSame(from, "day"),
          to: day.isSame(to, "day")
        } : null,
        day
      })
    )

  
  return Promise.all(reservations
    .map(({reservation, day}) =>
      Promise.all(roomIds.map(roomId =>
        RESERVATION_DATES_DB
          .child(`${day.format("YYYY/MM/DD")}/r${roomId}/${reservationId}`)
          .set(reservation)
        )
      )
    )
  )
}

/**
 *  returns the difference of 2 objects
 * @param {object} o1 object to compare to
 * @param {object} o2 object to compare
 * @returns {object} the differnce
 */
export const diff = (o1, o2) => Object.keys(o2)
  .reduce((diff, key) => {
    if (o1[key] === o2[key]) return diff
    return {
      ...diff,
      [key]: o2[key]
    }
  }, {})
