import { useCallback, useMemo } from "react";
import {
  episodeUpdateBySeriesId,
  movieUpdateBlacklist,
  movieUpdateHistoryList,
  movieUpdateInfoAll,
  providerUpdateAll,
  seriesUpdateBlacklist,
  seriesUpdateHistoryList,
  seriesUpdateInfoAll,
  seriesUpdateWantedAll,
  systemUpdateEnabledLanguages,
  systemUpdateLanguages,
  systemUpdateLanguagesProfiles,
  systemUpdateSettingsAll,
} from "../actions";
import { useReduxAction, useReduxStore } from "./base";

function stateBuilder<T, D extends (...args: any[]) => any>(
  t: T,
  d: D
): [Readonly<T>, D] {
  return [t, d];
}

export function useSystemSettings() {
  const action = useReduxAction(systemUpdateSettingsAll);
  const items = useReduxStore((s) => s.system.settings);
  return stateBuilder(items, action);
}

export function useLanguageProfiles() {
  const action = useReduxAction(systemUpdateLanguagesProfiles);
  const items = useReduxStore((s) => s.system.languagesProfiles.items);

  return stateBuilder(items, action);
}

export function useProfileBy(id: number | null | undefined) {
  const [profiles] = useLanguageProfiles();
  return useMemo(() => profiles.find((v) => v.profileId === id), [
    id,
    profiles,
  ]);
}

export function useLanguages(enabled: boolean = false) {
  const action = useReduxAction(
    enabled ? systemUpdateEnabledLanguages : systemUpdateLanguages
  );
  const items = useReduxStore((s) =>
    enabled ? s.system.enabledLanguage.items : s.system.languages.items
  );
  return stateBuilder(items, action);
}

export function useLanguageBy(code?: string) {
  const [languages] = useLanguages();
  const getter = useCallback(
    (code?: string) => {
      if (code === undefined) {
        return undefined;
      } else {
        return languages.find((v) => v.code2 === code);
      }
    },
    [languages]
  );
  return useMemo(() => getter(code), [code, getter]);
}

export function useSeries() {
  const action = useReduxAction(seriesUpdateInfoAll);
  const items = useReduxStore((d) => d.series.seriesList);
  return stateBuilder(items, action);
}

export function useEpisodes(seriesId?: number) {
  const action = useReduxAction(episodeUpdateBySeriesId);
  const callback = useCallback(() => {
    if (seriesId !== undefined) {
      action(seriesId);
    }
  }, [action, seriesId]);

  const list = useReduxStore((d) => d.series.episodeList);

  const items = useMemo(() => {
    if (seriesId !== undefined) {
      return list.items[seriesId] ?? [];
    } else {
      return [];
    }
  }, [seriesId, list.items]);

  const state: AsyncState<Item.Episode[]> = {
    ...list,
    items,
  };

  return stateBuilder(state, callback);
}

export function useMovies() {
  const action = useReduxAction(movieUpdateInfoAll);

  const items = useReduxStore((d) => d.movie.movieList);

  return stateBuilder(items, action);
}

export function useWantedSeries() {
  const action = useReduxAction(seriesUpdateWantedAll);
  const items = useReduxStore((d) => d.series.wantedSeriesList);

  return stateBuilder(items, action);
}

export function useWantedMovies() {
  const [movies, action] = useMovies();

  const items = useMemo<AsyncState<Item.Movie[]>>(() => {
    const items = movies.items.filter((v) => v.missing_subtitles.length !== 0);
    return {
      ...movies,
      items,
    };
  }, [movies]);

  return stateBuilder(items, action);
}

export function useProviders() {
  const action = useReduxAction(providerUpdateAll);
  const items = useReduxStore((d) => d.system.providers);

  return stateBuilder(items, action);
}

export function useBlacklistMovies() {
  const action = useReduxAction(movieUpdateBlacklist);
  const items = useReduxStore((d) => d.movie.blacklist);

  return stateBuilder(items, action);
}

export function useBlacklistSeries() {
  const action = useReduxAction(seriesUpdateBlacklist);
  const items = useReduxStore((d) => d.series.blacklist);

  return stateBuilder(items, action);
}

export function useMoviesHistory() {
  const action = useReduxAction(movieUpdateHistoryList);
  const items = useReduxStore((s) => s.movie.historyList);

  return stateBuilder(items, action);
}

export function useSeriesHistory() {
  const action = useReduxAction(seriesUpdateHistoryList);
  const items = useReduxStore((s) => s.series.historyList);

  return stateBuilder(items, action);
}
