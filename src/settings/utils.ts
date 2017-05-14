import { Auth, SessionName, ERROR_CODES } from '../api';
import { Settings, getHostUrl } from '../common';

export function saveSettings(settings: Settings) {
  console.log('persisting settings...');

  const hostUrl = getHostUrl(settings.connection);
  if (!hostUrl) {
    throw new Error('Host name is not properly configured!');
  } else {
    return Auth.Login(hostUrl, {
      account: settings.connection.username,
      passwd: settings.connection.password,
      session: SessionName.DownloadStation
    })
      .then(result => {
        if (result.success) {
          return Auth.Logout(hostUrl, result.data.sid, {
            session: SessionName.DownloadStation
          });
        } else {
          return Promise.resolve(result);
        }
      })
      .then(result => {
        if (!result.success) {
          throw new Error(ERROR_CODES.common[result.error.code] || ERROR_CODES.auth[result.error.code]);
        }
      })
      .then(() => {
        console.log('done persisting settings');
      });
  }
}

export type ConnectionTestResult = 'good' | 'bad-request' | 'network-error' | 'unknown-error' | 'missing-config' | { failMessage: string };

export function testConnection(settings: Settings): Promise<ConnectionTestResult> {
  function failureMessage(failMessage?: string) {
    if (failMessage) {
      return { failMessage };
    } else {
      return 'unknown-error';
    }
  }

  const host = getHostUrl(settings.connection);
  if (!host) {
    return Promise.resolve('missing-config' as 'missing-config');
  } else {
    // TODO: Log back out once we've tested.
    // TODO: Implement the save-settings button with this method.
    return Auth.Login(host, {
      account: settings.connection.username,
      passwd: settings.connection.password,
      session: SessionName.DownloadStation
    })
      .then(result => {
        if (!result) {
          return 'unknown-error';
        } else if (!result.success) {
          return failureMessage(ERROR_CODES.common[result.error.code] || ERROR_CODES.auth[result.error.code]);
        } else {
          return 'good';
        }
      })
      .catch((error?: any) => {
        if (error && error.response && error.response.status === 400) {
          return 'bad-request';
        } else if (error && error.message === 'Network Error') {
          return 'network-error';
        } else {
          console.log(error);
          return 'unknown-error';
        }
      });
  }
}

export function assertNever(n: never): never {
  throw new Error(`never assertion failed, got value ${n}`);
}
