const admin = require("firebase-admin")
const serviceAccount = require("./service-account-credentials.json")
const data = require("./data.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bibic-vendeghazak-api.firebaseio.com"
})
admin.firestore().settings({timestampsInSnapshots: true})

Object.keys(data)
  .forEach(key => {
    const nestedContent = data[key]

    if (typeof nestedContent === "object") {
      Object.keys(nestedContent)
        .forEach(docTitle => {
          admin.firestore()
            .collection(key)
            .doc(docTitle)
            .set(nestedContent[docTitle])
        })
    }
  })