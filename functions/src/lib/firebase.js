import * as admin from "firebase-admin"
import * as firebaseFunctions from "firebase-functions"

export const functions = firebaseFunctions.region("europe-west1")

let config
if(process.env.BETA) {
  const serviceAccount = require("../beta-service-account-credentials.json")
  config = {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bibic-vendeghazak-admin-beta.firebaseio.com",
    storageBucket: "bibic-vendeghazak-admin-beta.appspot.com"
  }
} else {
  const serviceAccount = require("../service-account-credentials.json")
  config = {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bibic-vendeghazak-api.firebaseio.com",
    storageBucket: "bibic-vendeghazak-api.appspot.com"
  }
}

const firebase = admin.initializeApp(config)

export default firebase

export const firestore = firebase.firestore()
firestore.settings({
  timestampsInSnapshots: true,
})

export const storage = firebase.storage()
export const database = firebase.database()

export const RESERVATIONS_FS = firestore.collection("reservations")
export const ROOMS_DB = database.ref("rooms")
export const RESERVATION_DATES_DB = database.ref("reservationDates")
