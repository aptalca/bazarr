import React from "react";
import { Container, Row } from "react-bootstrap";
import { connect } from "react-redux";
import { Helmet } from "react-helmet";

import { updateHistorySeriesList } from "../../@redux/actions";

import Table from "./table";

interface Props {
  update: () => void;
}

class SeriesHistoryView extends React.Component<Props> {
  componentDidMount() {
    this.props.update();
  }
  render() {
    return (
      <Container fluid>
        <Helmet>
          <title>Series History - Bazarr</title>
        </Helmet>
        <Row>
          <Table></Table>
        </Row>
      </Container>
    );
  }
}

export default connect(null, { update: updateHistorySeriesList })(
  SeriesHistoryView
);