import { RESERVATIONS_FS } from "../firebase"
import { CORS_WEB_URL } from "../constants"

export function reservationExists({query: {id, customId}}, response) {
  response.setHeader("Access-Control-Allow-Origin", CORS_WEB_URL)
  return RESERVATIONS_FS.doc(id).get().then(reservation =>
    response.send(
      JSON.stringify(reservation.exists && reservation.data().id === customId)
    )
  )
}

