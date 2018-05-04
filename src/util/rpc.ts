import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { ApiError, ApiRequestStatus, TranslatedError } from '../interfaces';

export function transformErrorResponse<T = any>(response: HttpErrorResponse | TranslatedError | Error): ApiRequestStatus<T> {
  let apiError: ApiError<T>;
  if (response instanceof Error) {
    console.error(response);
    return {
      loading: false,
      success: false,
      error: {
        status_code: 0,
        error: 'unknown',
        data: null,
      },
    };
  }
  if (response instanceof TranslatedError) {
    return {
      loading: false,
      success: false,
      error: {
        status_code: 0,
        error: response.translationKey,
        data: response.params,
      },
    };
  }
  if (typeof response.error === 'object' && !(response.error instanceof ProgressEvent)) {
    const err = response.error && response.error.message;
    apiError = {
      status_code: response.status,
      error: err || 'unknown',
      data: response.error,
    };
  } else {
    // Most likely a non-json response
    apiError = {
      status_code: response.status,
      error: response.statusText,
      data: <any>{},
    };
  }
  if (apiError.status_code === 500) {
    apiError.error = 'unknown';
  }
  return {
    error: apiError,
    loading: false,
    success: false,
  };
}

export function handleError(action: any, response: HttpErrorResponse | TranslatedError | Error) {
  return of(new action(transformErrorResponse(response)));
}

export function parseQuery(queryString: string): { [ key: string ]: string } {
  const query: { [ key: string ]: string } = {};
  const pairs = (queryString[ 0 ] === '?' ? queryString.substr(1) : queryString).split('&');
  for (const pair of pairs) {
    const [ key, value ] = pair.split('=');
    query[ decodeURIComponent(key) ] = decodeURIComponent(value || '');
  }
  return query;
}
