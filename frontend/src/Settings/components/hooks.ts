import { isArray, isEqual } from "lodash";
import { useCallback, useMemo } from "react";
import { useStore } from "react-redux";
import { mergeArray } from "../../utilites";
import { useSettings, useStaged, useUpdate } from "./provider";

type ValidateFuncType<T> = (v: any) => v is T;

export type OverrideFuncType<T> = (
  settings: SystemSettings,
  store: StoreState
) => T;

export function useExtract<T>(
  key: string,
  validate: ValidateFuncType<T>,
  override?: OverrideFuncType<T>
): Readonly<T | undefined> {
  const settings = useSettings();

  const store = useStore<StoreState>();

  const extractValue = useMemo(() => {
    let value: T | undefined = undefined;

    const path = key.split("-");

    if (path[0] !== "settings") {
      return undefined;
    }

    let item: LooseObject = settings;
    for (const key of path) {
      if (key !== "settings" && key in item) {
        item = item[key];
      }

      if (validate(item)) {
        value = item;
        break;
      }
    }

    return value;
  }, [key, settings, validate]);

  if (override) {
    // TODO: Temporarily override
    return override(settings, store.getState());
  } else {
    return extractValue;
  }
}

export function useUpdateArray<T>(
  key: string,
  compare?: (one: T, another: T) => boolean
) {
  const update = useUpdate();
  const stagedValue = useStaged();

  if (compare === undefined) {
    compare = isEqual;
  }

  const staged: T[] = useMemo(() => {
    if (key in stagedValue) {
      return stagedValue[key];
    } else {
      return [];
    }
  }, [key, stagedValue]);

  return useCallback(
    (v: T) => {
      const newArray = [...staged];
      const idx = newArray.findIndex((inn) => compare!(inn, v));
      if (idx !== -1) {
        newArray[idx] = v;
      } else {
        newArray.push(v);
      }
      update(newArray, key);
    },
    [compare, staged, key, update]
  );
}

export function useLatest<T>(
  key: string,
  validate: ValidateFuncType<T>,
  override?: OverrideFuncType<T>
): Readonly<T | undefined> {
  const extractValue = useExtract<T>(key, validate, override);
  const stagedValue = useStaged();
  if (key in stagedValue) {
    return stagedValue[key] as T;
  } else {
    return extractValue;
  }
}

// Merge Two Array
export function useLatestMergeArray<T>(
  key: string,
  compare: Comparer<T>,
  override?: OverrideFuncType<T[]>
): Readonly<T[] | undefined> {
  const extractValue = useExtract<T[]>(key, isArray, override);
  const stagedValue = useStaged();

  if (compare === undefined) {
    compare = isEqual;
  }

  let staged: T[] | undefined = undefined;
  if (key in stagedValue) {
    staged = stagedValue[key];
  }

  return useMemo(() => {
    if (staged !== undefined && extractValue) {
      return mergeArray(extractValue, staged, compare);
    } else {
      return extractValue;
    }
  }, [extractValue, staged, compare]);
}
