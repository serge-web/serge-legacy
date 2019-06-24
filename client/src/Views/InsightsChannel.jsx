import React, { Component } from 'react';
import Badge from "react-bootstrap/Badge";
import { connect } from "react-redux";
import {
  getAllWargameFeedback,
} from "../ActionsAndReducers/playerUi/playerUi_ActionCreators";
import '../scss/App.scss';
import moment from "moment";

class InsightsChannel extends Component {

  constructor(props) {
    super(props);

    this.state = {
      activeTab: Object.keys(this.props.playerUi.channels)[0],
    };
  }

  componentWillReceiveProps(nextProps, nextContext) {
    let channelLength = Object.keys(this.props.playerUi.channels).length;
    let nextChannelLength = Object.keys(nextProps.playerUi.channels).length;

    if (channelLength !== nextChannelLength) this.forceUpdate();

  }

  componentWillMount() {
    this.props.dispatch(getAllWargameFeedback(this.props.playerUi.currentWargame));
  }

  render() {

    return (
      <div className="message-list">
        {this.props.playerUi.feedbackMessages.map((message, i) => {
          return (
            <React.Fragment key={`feedback${i}`}>
              <div className="info-wrap">
                <Badge pill variant="primary">{message.details.from.force}</Badge>
                <Badge pill variant="secondary">{message.details.from.role}</Badge>
                {message.details.from.name && <Badge pill variant="warning">{message.details.from.name}</Badge>}
                <span>{moment(message.details.timestamp).format("YYYY-MMM-DD HH:mm")}</span>
              </div>
              {message.message.content}
              <p className="feedback-marker" style={{borderColor: message.details.from.forceColor}}></p>
            </React.Fragment>
          )
        })
        }
      </div>
    );
  }
}

const mapStateToProps = ({ playerUi }) => ({
  playerUi,
});

export default connect(mapStateToProps)(InsightsChannel);
