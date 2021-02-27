import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBug,
  faCode,
  faExclamationCircle,
  faInfoCircle,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { FunctionComponent, useMemo } from "react";
import { Column } from "react-table";
import { BaseTable, DateFormatter } from "../../components";

interface Props {
  logs: SystemLog[];
}

function mapTypeToIcon(type: SystemLogType): IconDefinition {
  switch (type) {
    case "DEBUG":
      return faCode;
    case "ERROR":
      return faBug;
    case "INFO":
      return faInfoCircle;
    case "WARNING":
      return faExclamationCircle;
    default:
      return faQuestion;
  }
}

const Table: FunctionComponent<Props> = ({ logs }) => {
  const columns: Column<SystemLog>[] = useMemo<Column<SystemLog>[]>(
    () => [
      {
        accessor: "type",
        Cell: (row) => (
          <FontAwesomeIcon icon={mapTypeToIcon(row.value)}></FontAwesomeIcon>
        ),
      },
      {
        Header: "Message",
        accessor: "message",
      },
      {
        Header: "Time",
        accessor: "timestamp",
        Cell: (row) => <DateFormatter>{row.value}</DateFormatter>,
      },
    ],
    []
  );

  return <BaseTable columns={columns} data={logs}></BaseTable>;
};

export default Table;
