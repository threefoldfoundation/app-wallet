import { Observable, Subject } from 'rxjs';

export function filterNull<T>() {
  return function filterNullImplementation(source: Observable<T | null>): Observable<T> {
    return Observable.create((subscriber: Subject<T>) => {
      return source.subscribe(value => {
          if (value !== null) {
            try {
              subscriber.next(<T>value);
            } catch (err) {
              subscriber.error(err);
            }
          }
        },
        err => subscriber.error(err),
        () => subscriber.complete());
    });
  };
}
