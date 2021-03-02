import React, {
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Container, Image, ListGroup } from "react-bootstrap";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import logo from "../@static/logo64.png";
import { SidebarToggleContext } from "../App";
import {
  ActiveKeyContext,
  BadgesContext,
  CollapseItem,
  LinkItem,
} from "./items";
import { SidebarList } from "./list";
import "./style.scss";
import { BadgeProvider } from "./types";

interface Props {
  movies_badge: number;
  episodes_badge: number;
  providers_badge: number;
  open?: boolean;
}

function mapStateToProps({ badges }: ReduxStore) {
  return {
    movies_badge: badges.movies,
    episodes_badge: badges.episodes,
    providers_badge: badges.providers,
  };
}

const Sidebar: FunctionComponent<Props> = ({
  movies_badge,
  episodes_badge,
  providers_badge,
  open,
}) => {
  const toggle = useContext(SidebarToggleContext);

  const badges = useMemo<BadgeProvider>(
    () => ({
      Wanted: {
        Series: episodes_badge,
        Movies: movies_badge,
      },
      System: {
        Providers: providers_badge,
      },
    }),
    [episodes_badge, movies_badge, providers_badge]
  );

  const history = useHistory();

  const [activeKey, setActiveKey] = useState("");

  useEffect(() => {
    const path = history.location.pathname.split("/");
    const len = path.length;
    if (len >= 3) {
      setActiveKey(path[len - 2]);
    } else {
      setActiveKey(path[len - 1]);
    }
  }, [history.location.pathname]);

  const cls = ["sidebar-container"];
  const overlay = ["sidebar-overlay"];

  if (open && open === true) {
    cls.push("open");
    overlay.push("open");
  }

  const sidebarItems = useMemo(
    () =>
      SidebarList.map((v) => {
        if ("children" in v) {
          return <CollapseItem key={v.name} {...v}></CollapseItem>;
        } else {
          return <LinkItem key={v.link} {...v}></LinkItem>;
        }
      }),
    []
  );

  return (
    <React.Fragment>
      <aside className={cls.join(" ")}>
        <Container className="sidebar-title d-flex align-items-center d-md-none">
          <Image alt="brand" src={logo} width="32" height="32"></Image>
        </Container>
        <ActiveKeyContext.Provider value={[activeKey, setActiveKey]}>
          <BadgesContext.Provider value={badges}>
            <ListGroup variant="flush">{sidebarItems}</ListGroup>
          </BadgesContext.Provider>
        </ActiveKeyContext.Provider>
      </aside>
      <div className={overlay.join(" ")} onClick={toggle}></div>
    </React.Fragment>
  );
};

export default connect(mapStateToProps)(Sidebar);
