import {startOfDay} from "date-fns"

// Global variable

export const ADMIN_ROOT = process.env.BETA ? 
  "https://bibic-vendeghazak-admin-beta.firebaseapp.com" :
  "https://admin.bibicvendeghazak.hu"

export const WEB = "https://bibicvendeghazak.hu"
export const ADDRESS = "Nagybajom, Bibic vendégházak, Iskola köz, Hungary"
export const APP_NAME = "Bíbic vendégházak"
export const ADMIN_EMAIL = "szallasfoglalas@bibicvendeghazak.hu"
export const NO_REPLY = "no-reply@bibicvendeghazak.hu"
export const ADMIN_RESERVATION_EMAIL = `${APP_NAME} 🏠 <${ADMIN_EMAIL}>`
export const FOOTER = `Üdvözlettel ${APP_NAME}`
export const TEL = "+36 30 433 6698"


export const TODAY = startOfDay(new Date())