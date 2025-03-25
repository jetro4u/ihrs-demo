import { useCallback, useEffect, useRef } from 'react';
import _ from 'lodash';

function useMatrixDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const callbackRef = useRef(callback);
  
  // Update the current callback each time it changes
  useEffect(() => {
	callbackRef.current = callback;
  }, [callback]);
  
  const debouncedFn = useCallback(
	_.debounce((...args: any[]) => {
	  callbackRef.current(...args);
	}, delay),
	[delay]
  );
  
  useEffect(() => {
	return () => {
	  debouncedFn.cancel();
	};
  }, [debouncedFn]);
  
  return debouncedFn as unknown as T;
}

export default useMatrixDebounce;
