import {
  createInternalTrafficActivationLinkAction,
  listInternalTrafficDevicesAction,
  revokeInternalTrafficDeviceAction,
} from "./internal-traffic-actions";

export const adminInternalTrafficRepository = {
  createActivationLink: createInternalTrafficActivationLinkAction,
  list: listInternalTrafficDevicesAction,
  revoke: revokeInternalTrafficDeviceAction,
};
