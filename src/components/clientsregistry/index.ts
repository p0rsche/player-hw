import { IVideoClient } from './videoclient'

import { debug } from '../../utils/helpers'


export interface IClientRegistry {
  register: (client: IVideoClient) => void
  unregister: (client: IVideoClient) => void
  getDefaultClient: () => IVideoClient
  findClientByExt: (ext: string) => IVideoClient
}

export default class VideoClientRegistry implements IClientRegistry {
  private registeredClients: Set<IVideoClient> = new Set()
  private defaultClient: IVideoClient

  register(client: IVideoClient) {
    if (client.isDefault()) {
      if (this.defaultClient) {
        debug('Default client is already registered')
        return
      }
      this.defaultClient = client
    }
    this.registeredClients.add(client)
    return this
  }

  unregister(client: IVideoClient) {
    this.defaultClient = null
    this.registeredClients.delete(client)
    return this
  }

  getDefaultClient() {
    return this.defaultClient
  }

  findClientByExt(ext: string) {
    let foundClient
    try {
      this.registeredClients.forEach(client => {
        if (client.supports(ext)) {
          foundClient = client
          throw new Error() // throwing just to short-circuit and exit from forEach
          //we could use iterator, but need to set TS target other than es5
        }
      })
    } catch (e) {
      // just chillin
    }
    return foundClient
  }

  destroy() {
    this.registeredClients = null
    this.defaultClient = null
  }
}