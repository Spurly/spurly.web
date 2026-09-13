import hubAccountGateway from '../gateway/account.js';

/**
 * Hub account controller — the one thing the settings page/hook is allowed
 * to call. Never the gateway directly. Pure pass-through today, same
 * reasoning as every other hub controller.
 */
class AccountController {
  get() {
    return hubAccountGateway.get();
  }

  createLink() {
    return hubAccountGateway.createLink();
  }

  refresh() {
    return hubAccountGateway.refresh();
  }

  disconnect() {
    return hubAccountGateway.disconnect();
  }
}

export const accountController = new AccountController();
export default accountController;
