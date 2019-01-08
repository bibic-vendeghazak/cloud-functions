import { RESERVATIONS_FS } from "../firebase"

export function reservationExists({query: {id, customId}}, response) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  return RESERVATIONS_FS.doc(id).get().then(reservation =>
    response.send(
      JSON.stringify(reservation.exists && reservation.data().id === customId)
    )
  )
}

