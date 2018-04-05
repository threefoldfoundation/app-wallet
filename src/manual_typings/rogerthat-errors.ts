export interface RogerthatMessageOpenError {
  type: string; // e.g. MessageNotFound
}

export interface RogerthatError {
  /**
   * snake_case error code
   */
  code: string;
  /**
   * Error message
   */
  message: string;
  /**
   * @deprecated use the `message` property instead
   */
  exception?: string;
}

export interface StartScanningQrCodeError extends RogerthatError {
  code: 'camera_was_already_open' | 'unsupported_camera_type' | 'camera_permission_was_not_granted';
}

export interface StopScanningQrCodeError extends RogerthatError {
  code: 'unsupported_camera_type';
}
