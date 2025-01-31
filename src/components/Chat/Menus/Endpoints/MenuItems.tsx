import type { FC } from 'react';
import { Close } from '@radix-ui/react-popover';
import { EModelEndpoint, alternateName } from 'librechat-data-provider';
import MenuSeparator from '../UI/MenuSeparator';
import MenuItem from './MenuItem';

const EndpointItems: FC<{
  endpoints: EModelEndpoint[];
  selected: EModelEndpoint | '';
}> = ({ endpoints, selected }) => {
  return (
    <>
      {endpoints &&
        endpoints.map((endpoint, i) => {
          if (!endpoint) {
            return null;
          }
          const userProvidesKey: boolean | null | undefined = undefined;
          return (
            <Close asChild key={`endpoint-${endpoint}`}>
              <div key={`endpoint-${endpoint}`}>
                <MenuItem
                  key={`endpoint-item-${endpoint}`}
                  title={alternateName[endpoint] || endpoint}
                  value={endpoint}
                  selected={selected === endpoint}
                  data-testid={`endpoint-item-${endpoint}`}
                  userProvidesKey={!!userProvidesKey}
                  // description="With DALL·E, browsing and analysis"
                />
                {i !== endpoints.length - 1 && <MenuSeparator />}
              </div>
            </Close>
          );
        })}
    </>
  );
};

export default EndpointItems;
