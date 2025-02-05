import { useMemo, useCallback } from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import {
  useUserKeyQuery,
  // useGetEndpointsQuery,
  useUpdateUserKeysMutation,
} from 'librechat-data-provider/react-query';

const useUserKey = (endpoint: string) => {
  //const { data: endpointsConfig } = useGetEndpointsQuery();
  const endpointsConfig = {};
  const config = endpointsConfig?.[endpoint ?? ''];

  const { azure } = config ?? {};
  let keyName = endpoint;

  if (azure) {
    keyName = EModelEndpoint.azureOpenAI;
  } else if (keyName === EModelEndpoint.gptPlugins) {
    keyName = EModelEndpoint.openAI;
  }

  const updateKey = useUpdateUserKeysMutation();
  const checkUserKey = useUserKeyQuery(keyName);
  const getExpiry = useCallback(() => {
    if (checkUserKey.data) {
      return checkUserKey.data.expiresAt;
    }
  }, [checkUserKey.data]);

  const checkExpiry = useCallback(() => {
    const expiresAt = getExpiry();
    if (!expiresAt) {
      return false;
    }

    const expiresAtDate = new Date(expiresAt);
    if (expiresAtDate < new Date()) {
      return false;
    }
    return true;
  }, [getExpiry]);

  const saveUserKey = useCallback(
    (userKey: string, expiresAt: number) => {
      const dateStr = new Date(expiresAt).toISOString();
      updateKey.mutate({
        name: keyName,
        value: userKey,
        expiresAt: dateStr,
      });
    },
    [updateKey, keyName],
  );

  return useMemo(
    () => ({ getExpiry, checkExpiry, saveUserKey }),
    [getExpiry, checkExpiry, saveUserKey],
  );
};

export default useUserKey;
