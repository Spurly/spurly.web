import hubNetworkGateway from '../gateway/network.js';
import { NETWORK_EVENTS } from '../constants/constants.js';

/** The one thing the Network page may call — never the gateway directly. */

async function getNetwork(eventEmitter) {
  try {
    const data = await hubNetworkGateway.getNetwork();
    eventEmitter.emit(NETWORK_EVENTS.GET_NETWORK_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(NETWORK_EVENTS.GET_NETWORK_FAILURE, error);
  }
}

async function syncNetwork(eventEmitter) {
  try {
    const data = await hubNetworkGateway.syncNetwork();
    eventEmitter.emit(NETWORK_EVENTS.SYNC_NETWORK_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(NETWORK_EVENTS.SYNC_NETWORK_FAILURE, error);
  }
}

async function listConnections(eventEmitter, params) {
  try {
    const data = await hubNetworkGateway.listConnections(params);
    eventEmitter.emit(NETWORK_EVENTS.LIST_CONNECTIONS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(NETWORK_EVENTS.LIST_CONNECTIONS_FAILURE, error);
  }
}

const hubNetworkController = { getNetwork, syncNetwork, listConnections };
export default hubNetworkController;
