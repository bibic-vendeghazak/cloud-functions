import * as functions from "firebase-functions"
import nodemailer from "nodemailer"
import { ADMIN_EMAIL, ADMIN_RESERVATION_EMAIL, NO_REPLY } from "../constants"
import { RESERVATIONS_FS } from "../firebase"
import { getIcalEvent, getQRCode } from "./attachments"
import { acceptedUserText, adminMessage, adminText, changedFirstUserText, changedUserText, createdUserText, deletedUserText, reservationHTML, userMessage, feedbackHTML } from "./templates"
import { reservationToHTML } from "./utils"


// Init email
const {email: user, password: pass} = functions.config().gmail

const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {user, pass}
})



// Possible messages
const messages = {
  accepted: {
    admin: {
      html: reservation => reservationHTML("admin", "default", reservation),
      subject: "Foglalás jóváhagyva 🎉",
      text: adminText
    },
    user: {
      html: reservation => reservationHTML("user", "accepted", reservation),
      text: acceptedUserText,
      subject: "Foglalását jóváhagytuk 🎉"
    },
  },
  created: {
    admin: {
      html: reservation => reservationHTML("admin", "default", reservation),
      subject: "Új foglalás 🔔",
      text: adminText
    },
    user: {
      html: () => null,
      text: createdUserText,
      subject: "Foglalása jóváhagyásra vár 🔔"
    },
  },
  changed: {
    admin: {
      html: reservation => reservationHTML("admin", "default", reservation),
      subject: "Foglalás módosítva ✍",
      text: adminText
    },
    user: {
      html: () => null,
      subject: "Foglalását módosítottuk ✍",
      text: changedUserText
    }
  },
  changedFirst: {
    admin: {
      html: reservation => reservationHTML("admin", "default", reservation),
      subject: "Foglalás módosítva ✍",
      text: adminText
    },
    user: {
      html: reservation => reservationHTML("user", "accepted", reservation),
      subject: "Foglalás rögzítve ✍",
      text: changedFirstUserText
    }
  },
  deleted: {
    admin: {
      html: () => null,
      subject: "Foglalás törölve ❌",
      text: adminText
    },
    user: {
      html: () => null,
      subject: "Foglalását töröltük ❌",
      text: deletedUserText
    }
  }
}


/**
 * Sends an e-mail about a reservation.
 * @param {object} reservation The reservation itself.
 * @param {('created' | 'accepted' | 'deleted' | 'rejected' | 'changed' | 'changedFirst')} type 
 * Type of the e-mail
 * @param {('admin' | 'user')} target Who will receive the e-mail.
 */
export async function sendReservationEmail(reservation, type, target) {
  let replyTo = ADMIN_EMAIL
  let to = reservation.email

  if (target === "admin") {
    replyTo = NO_REPLY
    to = ADMIN_EMAIL
  }

  const mail = await {
    replyTo,
    from: ADMIN_RESERVATION_EMAIL,
    to,
    text: messages[type][target].text(reservation),
    subject: messages[type][target].subject,
  }

  mail.html = await messages[type][target].html(reservation)

  if (["accepted", "changedFirst"].includes(type) && target === "user") {
    const QRCode = await getQRCode(reservation.reservationId)
    mail.icalEvent = getIcalEvent(reservation)
    mail.attachments = [{
      content: QRCode.split("base64,")[1],
      encoding: "base64",
      name: "qr.png",
      cid: "qr-code-123" //same cid value as in the html img src
    }]
  }

  await mailTransport.sendMail(mail)
  return  console.log(`E-mail sent to ${mail.to}`)
}

/**
 * Sends an e-mail about a message.
 * @param {object} message The message itself.
 */
export async function sendMessageEmails(message) {
  return Promise.all([
    {
      // To user
      replyTo: ADMIN_EMAIL,
      from: ADMIN_RESERVATION_EMAIL,
      to: message.email,
      text: userMessage(message),
      subject: "Üzenetét megkaptuk 👍"
    },
    {
      // To admin
      replyTo: message.email,
      from: message.email,
      text: adminMessage(message),
      to: ADMIN_EMAIL,
      subject: "Új üzenet! 🔔"
    }
  ].map(target => mailTransport.sendMail(target)))
    .then(() => console.log("Email sent"))
}


export async function sendFeedbackEmails(emails) {
  return (
    emails.map(async (reservation) => {
      const mail = {
        replyTo: ADMIN_EMAIL,
        from: ADMIN_RESERVATION_EMAIL,
        to: reservation.email,
        subject: "Reméljük, hogy jól érezte magát! 👌"
      }
      mail.html = await feedbackHTML(reservation)
      await mailTransport.sendMail(mail)
      await RESERVATIONS_FS.doc(reservation.reservationId).update({archived: true})
      return console.log(`Feedback sent, reservation ${reservation.reservationId} archived`)
    })
  )
}