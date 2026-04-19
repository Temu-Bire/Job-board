import { memo, useCallback, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';

/**
 * Wraps Google One Tap / button flow so credential handling is idempotent
 * and parent re-renders do not stack duplicate in-flight requests.
 */
function GoogleCredentialButton({ onCredential, disabled, ...rest }) {
  const busyRef = useRef(false);

  const handleSuccess = useCallback(
    async (credentialResponse) => {
      if (disabled || busyRef.current) return;
      busyRef.current = true;
      try {
        await onCredential(credentialResponse);
      } finally {
        busyRef.current = false;
      }
    },
    [disabled, onCredential]
  );

  return (
    <div className="google-oauth-button">
      <GoogleLogin {...rest} onSuccess={handleSuccess} />
    </div>
  );
}

export default memo(GoogleCredentialButton);
