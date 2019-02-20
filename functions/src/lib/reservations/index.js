import { functions } from "../firebase"
import { sendReservationEmail } from "../email"
import moment from "../moment"
import { updateReservationDates } from "./utils"
import {reservationExists} from "./exists"
import deepEqual from "deep-equal"
import { getOverlaps } from "./overlaps"

export const overlaps = getOverlaps
export const exists = reservationExists

const reservationRef = functions.firestore
  .document("reservations/{reservationId}")


export const reservationCreated = reservationRef
  .onCreate(async (snap, {params: {reservationId}}) => {
    const reservation = snap.data()
    const {from, to, roomId, handled} = reservation
    console.log(`reservation ${reservationId} created`)

    let type = "created"

    /* check if admin created this reservation,
     * for the sake of right phrasing in the e-mail to be sent
     */
    if (handled === true) {
      type = "changedFirst"
    }

    // create dates✨
    await updateReservationDates(from, to, roomId, snap.id)
    /* if creating dates was successful, send an e-mail, but
     * do not send if the reservation was added by the admin
     * NOTE: remember to add reservationId to the reservation that will be passed to the email
     */
    if (reservation.email === "") {
      return console.log("created by admin, exiting...")
    }

    console.log("now the emails")

    return Promise.all(["admin", "user"].map(target => 
      sendReservationEmail({reservationId, ...reservation}, type, target)
    ))
  })

export const reservationDeleted = reservationRef
  .onDelete(async (snap, {params: {reservationId}}) => {
    const reservation = snap.data()
    const {from, to, roomId} = reservation
    console.log(`reservation ${reservationId} deleted`)

    // sanitize dates 🔥
    await updateReservationDates(from, to, roomId, reservationId, true)
    /* if sanitizing was successful, send an e-mail, but
     * do not send if the reservation was added by the admin
     * NOTE: remember to add reservationId to the reservation that will be passed to the email
     */
    if (reservation.email === "") {
      return console.log("created by admin, exiting...")
    }

    return Promise.all(["admin", "user"].map(target =>
      sendReservationEmail({reservationId, ...reservation}, "deleted", target)
    ))
  })

export const reservationChanged = reservationRef
  .onUpdate(async ({before, after}, {params: {reservationId}}) => {
    before = {...before.data()}
    after = {...after.data()}

    // To avoid sending unnecessary e-mails
    delete before.archived
    delete after.archived
    delete before.deleteReason
    delete after.deleteReason

    if (deepEqual(after, before)) {
      console.log("reservationChanged fired, but no change, exiting...")
      return null
    }


    console.log(`reservation ${reservationId} changed`)

    const shouldSanitize = 
      !moment(before.from.toDate()).isSame(moment(after.from.toDate())) ||
      !moment(before.to.toDate()).isSame(moment(after.to.toDate())) ||
      before.roomId.sort().join() !== after.roomId.sort().join()

    if (shouldSanitize) {
      // sanitize dates 🔥 - to avoid conflicts
      await updateReservationDates(before.from, before.to, before.roomId, reservationId, true)
    }

    // ✨ add new dates
    console.log("updating reservation dates")
    await updateReservationDates(after.from, after.to, after.roomId, reservationId)


    console.log("now the emails")

   /*
    * Send an e-mail about the changes, except if
    * the reservation was added by the admin.
    */

    if (after.email === "") {
      return console.log("created by admin, exiting...")
    }

    // determine what type of email will be sent
    let type = null

    if (before.handled === false && after.handled === true) {
    // reservation accepted 🎉 - It was created by a user, an admin accepts it for the first time
      type = "accepted"
    } else if (before.handled === true && after.handled === true && !deepEqual(before, after)) {
    // reservation changed 🔔 - An admin made a change on the reservation.

      /* check if it is the first time that we send a mail to the user
      * (then it need a different phrasing in the email)
      */
      if (before.email === "") {
        type = "changedFirst"
      } else {
        type = "changed"
      // WIP: we should only notify the user about the changed things
      // after = utils.diff(before, after)
      }
    }

    /* send e-mail(s) with the new reservation information
  * NOTE: remember to add reservationId to the reservation that will be passed to the email
  */
    return Promise.all(["admin", "user"].map(target =>
      sendReservationEmail({reservationId, ...after}, type, target)
    ))
  })
