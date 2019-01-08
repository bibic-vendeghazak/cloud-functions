import { sendMessageEmails } from "../email"

/**
 * Fires an event when a message has been created.
 * @param {object} message The message itself.
 */
export function messageCreated(message) {
  message = message.data()
  console.log(`message ${message.id} created, now sending emails`)
  return sendMessageEmails(message)
}