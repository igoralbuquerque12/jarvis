import { createContext, useContext } from 'react';

export interface PrivacyContextValue {
  hidden: boolean;
  toggle: () => void;
}

export const PrivacyContext = createContext<PrivacyContextValue>({
  hidden: false,
  toggle: () => {},
});

export function usePrivacy() {
  return useContext(PrivacyContext);
}
