// src/firebase/errors.ts

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * A custom error class to represent Firestore permission-denied errors.
 * It formats the error message to be more informative for developers,
 * including details about the operation, path, and the data being sent.
 */
export class FirestorePermissionError extends Error {
  constructor(context: SecurityRuleContext) {
    const contextString = JSON.stringify(
      {
        path: context.path,
        operation: context.operation,
        requestResourceData: context.requestResourceData,
      },
      null,
      2
    );

    const message = `Firestore Permission Denied:
The following request was denied by Firestore Security Rules:
${contextString}`;

    super(message);
    this.name = 'FirestorePermissionError';

    // This is to make sure that the error is properly captured in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
