import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const sdk = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  appBaseUrl
});

let adminEntityMode = false;

const adminEntities = new Proxy({}, {
  get(_target, entityName) {
    if (typeof entityName !== 'string') return undefined;
    return new Proxy({}, {
      get(_entity, method) {
        if (typeof method !== 'string') return undefined;
        return async (...args) => {
          const response = await sdk.functions.invoke('adminEntity', {
            entity: entityName,
            method,
            args
          });
          return response.data?.result;
        };
      }
    });
  }
});

export function setAdminEntityMode(enabled) {
  adminEntityMode = enabled === true;
}

export const base44 = new Proxy(sdk, {
  get(target, property) {
    if (property === 'entities' && adminEntityMode) return adminEntities;
    return Reflect.get(target, property, target);
  }
});
