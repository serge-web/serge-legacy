import React, { Component } from 'react';
import {connect} from 'react-redux';

import '../../scss/App.scss';
import Select from "react-select";
import {faCheck} from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

class EditSubscriptionRow extends Component {

  constructor(props) {
    super(props);

    this.state = {
      subscriptionId: this.props.data.subscriptionId,
      editSubscriptionForce: {value: this.props.data.force, label: this.props.data.force},
      editSubscriptionRole: {value: this.props.data.role, label: this.props.data.role},
      editSubscriptionTemplates: this.props.data.templates,
    };
  }

  updateSubscriptionForce = (option) => {
    this.setState({
      editSubscriptionForce: option,
    });
  };

  updateSubscriptionRole = (option) => {
    this.setState({
      editSubscriptionRole: option,
    });
  };

  updateSubscriptionTemplates = (option) => {
    this.setState({
      editSubscriptionTemplates: option,
    });
  };

  updateChannel = () => {
    let subscriptionData = {
      force: this.state.editSubscriptionForce.label,
      role: this.state.editSubscriptionRole.label,
      templates: this.state.editSubscriptionTemplates,
    };
    this.props.updateRecipient(this.state.subscriptionId, subscriptionData);
    this.props.cancelEdit();
  };

  render() {
    return (
      <tr>
        <td>
          <Select
            value={this.state.editSubscriptionForce}
            options={this.props.forceOptions}
            onChange={this.updateSubscriptionForce}
          />
        </td>
        <td>
          <Select
            value={this.state.editSubscriptionRole}
            options={this.props.roleOptions}
            onChange={this.updateSubscriptionRole}
          />
        </td>
        <td>
          <Select
            value={this.state.editSubscriptionTemplates}
            options={this.props.templateOptions}
            onChange={this.updateSubscriptionTemplates}
            isMulti
          />
        </td>
        <td>
          <FontAwesomeIcon icon={faCheck} onClick={this.updateChannel} />
        </td>
      </tr>
    )
  }
}


export default connect()(EditSubscriptionRow);
