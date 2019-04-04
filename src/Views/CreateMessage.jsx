import React, { Component } from 'react';
import '../scss/App.scss';
import { connect } from "react-redux";

import JsonCreator from "../Components/JsonCreator";

import {getAllMessageTypes} from "../ActionsAndReducers/dbMessageTypes/messageTypes_ActionCreators";
import { resetMessagePreview } from "../ActionsAndReducers/dbMessages/messages_ActionCreators";

import Link from "../Components/Link";
import SearchList from "../Components/SearchList";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";

class EditMessage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      messageList: this.props.messageTypes.messages, // set to state for filter, without filter don't set props to state to avoid bugs
      searchInput: '',
    };
  }


  componentWillMount() {
    this.props.dispatch(resetMessagePreview());
    this.props.dispatch(getAllMessageTypes());
  };


  componentWillReceiveProps(nextProps, nextContext) {

    if (this.props.messageTypes.messages.length !== nextProps.messageTypes.messages.length) {
      this.setState({
        messageList: nextProps.messageTypes.messages
      });
    }
  }


  filterMessages = (input) => {

    let value = input.target.value;

    let newState = this.props.messageTypes.messages.filter(function(mes) {
      return mes.details.title.toLowerCase().indexOf(value.toLowerCase()) > -1;
    });

    this.setState({
      messageList: newState,
      searchInput: value.toLowerCase()
    });
  };

  render() {
    return (
      <div className="view-wrapper">
        <div id="sidebar">
          <Link href="/" id="home-btn"><FontAwesomeIcon icon={faArrowLeft} size="2x" /></Link>
        </div>
        <h1>Message library</h1>
        <div className="flex-content-wrapper">
          <div id="selection" className="flex-content">
            <SearchList key="search-templates"
                            listData={this.props.messageTypes}
                            placeholder={'Select template'}
            />
          </div>
          <div id="preview" className="flex-content flex-content--big">
            <JsonCreator id="preview" disabled={false} create={true} />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ messages, messageTypes, currentViewURI }) => ({
  messages,
  messageTypes,
  currentViewURI
});

export default connect(mapStateToProps)(EditMessage);