import { addToChecklist } from "../store/subscriber";
import {
  ActionDispatcher,
  AsyncActionDispatcher,
  AvaliableType,
  FillfulActionDispatcher,
} from "../types";

// Create a async action
function asyncActionCreator<T extends (...args: any[]) => Promise<any>>(
  type: string,
  promise: T,
  args: Parameters<T>
): AsyncActionDispatcher<PromiseType<ReturnType<T>>> {
  return (dispatch) => {
    dispatch({
      type,
      payload: {
        loading: true,
      },
    });
    promise(...args)
      .then((val) => {
        dispatch({
          type,
          payload: {
            loading: false,
            item: val,
          },
        });
      })
      .catch((err) => {
        dispatch({
          type,
          error: true,
          payload: {
            loading: false,
            item: err,
          },
        });
      });
  };
}

// Create a action which combine multiple ActionDispatcher and execute them at once
function combineActionCreator(dispatchers: AvaliableType[]): ActionDispatcher {
  return (dispatch) => {
    dispatchers.forEach((fn) => {
      if (typeof fn === "function") {
        fn(dispatch);
      } else {
        dispatch(fn);
      }
    });
  };
}

export function createAsyncAction<T extends (...args: any[]) => Promise<any>>(
  type: string,
  promise: T
) {
  return (...args: Parameters<T>) => asyncActionCreator(type, promise, args);
}

export function createCombineAction<
  T extends (...args: any[]) => AvaliableType[]
>(fn: T) {
  return (...args: Parameters<T>) => combineActionCreator(fn(...args));
}

export function createFulfilAction<
  T extends (...args: any[]) => AvaliableType[]
>(fn: T, checker: FillfulActionDispatcher) {
  addToChecklist(checker);
  return createCombineAction(fn);
}
