interface ItemModifyForm {
  id: number[];
  profileid: (number | undefined)[];
}

interface SubtitleForm {
  language: string;
  hi: boolean;
  forced: boolean;
}

interface SubtitleUploadForm extends SubtitleForm {
  file: File;
}

interface SubtitleDeleteForm extends SubtitleForm {
  path: string;
}

interface SeriesDownloadForm {
  episodePath: string;
  sceneName?: string;
  language: string;
  hi: boolean;
  forced: boolean;
  sonarrSeriesId: number;
  sonarrEpisodeId: number;
  title: string;
}

interface BlacklistAddForm {
  provider: string;
  subs_id: string;
  // code2
  language: string;
  forced: boolean;
  hi: boolean;
  path: string;
  subtitles_path: string;
}

interface BlacklistDeleteForm {
  provider: string;
  subs_id: string;
}

interface ManualDownloadForm {
  language: string;
  hi: PythonBoolean;
  forced: PythonBoolean;
  provider: string;
  subtitle: any;
}
