import { sendFeedbackEmails } from "../email"
import moment from "../moment"
import { firestore } from "../firebase"
import { CORS_WEB_URL } from "../constants"
export {feedbackChanged} from "./changed"

const RESERVATIONS_FS = firestore.collection("reservations")



export async function cron(_, res) {
  res.setHeader("Access-Control-Allow-Origin", CORS_WEB_URL)
  const emails = []
  try {
    const reservations = await RESERVATIONS_FS
      .where("archived", "==", false)
      .where("to", "<", moment().startOf("day").toDate())
      .get()

    await reservations.forEach(reservation => {
      const {email, name, id, roomId} = reservation.data()
      if (email !== "") {
        emails.push({reservationId: reservation.id, email, name, id, roomId})
      }
    })

    let message =  `${emails.length} Email(s) has been sent out.`
    if (emails.length) {
      await sendFeedbackEmails(emails)
    } else {
      message = "There was no need to send emails."
    }

    return res.send(JSON.stringify({code: "SUCCESS", message}))
  } catch (error) {
    return res.send(JSON.stringify(error))
  }
}