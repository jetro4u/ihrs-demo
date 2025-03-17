import { useState, useEffect } from 'react';

// Use import.meta.env to access environment variables
export const SELF_HOSTED_TENANT_API_KEY = import.meta.env.VITE_SELF_HOSTED_TENANT_API_KEY;
export const SELF_HOSTED_TENANT_API_SECRET = import.meta.env.VITE_SELF_HOSTED_TENANT_API_SECRET;
export const SELF_HOSTED_TENANT_UUID = import.meta.env.VITE_SELF_HOSTED_TENANT_UUID;

/**
 * Validates self-hosted tenant credentials.
 * You can override the default values by passing parameters.
 */
export function validateSelfHostedTenant(
  apiKey: string = SELF_HOSTED_TENANT_API_KEY,
  apiSecret: string = SELF_HOSTED_TENANT_API_SECRET,
  uuid: string = SELF_HOSTED_TENANT_UUID
): boolean {
  return (
    apiKey === SELF_HOSTED_TENANT_API_KEY &&
    apiSecret === SELF_HOSTED_TENANT_API_SECRET &&
    uuid === SELF_HOSTED_TENANT_UUID
  );
}

/**
 * Custom hook to validate self-hosted tenant credentials.
 * Only use this inside React components.
 */
export function useSelfHostedTenant(
  apiKey: string = SELF_HOSTED_TENANT_API_KEY,
  apiSecret: string = SELF_HOSTED_TENANT_API_SECRET,
  uuid: string = SELF_HOSTED_TENANT_UUID
): boolean | null {
  const [isValidTenant, setIsValidTenant] = useState<boolean | null>(null);

  useEffect(() => {
    setIsValidTenant(validateSelfHostedTenant(apiKey, apiSecret, uuid));
  }, [apiKey, apiSecret, uuid]);

  return isValidTenant;
}