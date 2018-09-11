class DCHandler {
  constructor (client, targetClient) {
    this.client = client
    this.targetClient = targetClient
  }

  handle (origin, cause, err) {
    this.client.print(`Connection ${cause} by ${origin}`, this.client.addr)
    if (origin === 'client') {
      this.client.ended = true
      if (!this.targetClient.ended) this.targetClient.end(cause)
    } else {
      this.targetClient.ended = true
      if (!this.client.ended) this.client.end(cause)
    }
    if (err) console.error(err)
  }
}

module.exports = DCHandler
