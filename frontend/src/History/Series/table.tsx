import React, { FunctionComponent, useMemo } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Column } from "react-table";
import { seriesUpdateHistoryList } from "../../@redux/actions";
import { AsyncStateOverlay, BaseTable, HistoryIcon } from "../../components";
import { SeriesBlacklistButton } from "../../components/speical";

interface Props {
  seriesHistory: AsyncState<SeriesHistory[]>;
  update: () => void;
}

function mapStateToProps({ series }: StoreState) {
  const { historyList } = series;
  return {
    seriesHistory: historyList,
  };
}

const Table: FunctionComponent<Props> = ({ seriesHistory, update }) => {
  const columns: Column<SeriesHistory>[] = useMemo<Column<SeriesHistory>[]>(
    () => [
      {
        accessor: "action",
        className: "text-center",
        Cell: (row) => <HistoryIcon action={row.value}></HistoryIcon>,
      },
      {
        Header: "Name",
        accessor: "seriesTitle",
        Cell: (row) => {
          const target = `/series/${row.row.original.sonarrSeriesId}`;

          return (
            <Link to={target}>
              <span>{row.value}</span>
            </Link>
          );
        },
      },
      {
        Header: "Episode",
        accessor: "episode_number",
      },
      {
        accessor: "episodeTitle",
      },
      {
        Header: "Date",
        accessor: "timestamp",
        className: "text-nowrap",
      },
      {
        Header: "Description",
        accessor: "description",
      },
      {
        accessor: "subs_id",
        Cell: (row) => {
          const original = row.row.original;

          return (
            <SeriesBlacklistButton
              seriesid={original.sonarrSeriesId}
              episodeid={original.sonarrEpisodeId}
              update={update}
              {...original}
            ></SeriesBlacklistButton>
          );
        },
      },
    ],
    [update]
  );

  return (
    <AsyncStateOverlay state={seriesHistory}>
      {(data) => (
        <BaseTable
          emptyText="Nothing Found in Series History"
          columns={columns}
          data={data}
        ></BaseTable>
      )}
    </AsyncStateOverlay>
  );
};

export default connect(mapStateToProps, { update: seriesUpdateHistoryList })(
  Table
);
