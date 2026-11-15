import { clearManagedSession } from 'src/shared/utils/managedSession.js';

/** The ended page has been shown: forget that this browser held a managed session. */
function acknowledgeEnded() {
  clearManagedSession();
}

const partnerController = {
  acknowledgeEnded,
};

export default partnerController;
