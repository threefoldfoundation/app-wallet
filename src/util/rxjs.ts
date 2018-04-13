import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

export function filterNull<T>() {
  return function filterNullImplementation(source: Observable<T>): Observable<NonNullable<T>> {
    return Observable.create((subscriber: Subject<NonNullable<T>>) => {
      return source.subscribe(value => {
          if (value !== null) {
            try {
              subscriber.next(<NonNullable<T>>value);
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
