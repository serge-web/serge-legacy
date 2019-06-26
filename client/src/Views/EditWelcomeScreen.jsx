import React, { Component } from 'react';
import { connect } from 'react-redux';
import '../scss/App.scss';
import Link from "../Components/Link";
import {
  ADMIN_ROUTE,
  MESSAGE_LIBRARY_ROUTE,
  MESSAGE_TEMPLATE_ROUTE,
  WELCOME_SCREEN_EDIT_ROUTE
} from "../consts";
import splitNewLineBreak from "../Helpers/splitNewLineBreak";
import TextInput from "../Components/Inputs/TextInput";
import {faPencilAlt} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import TextArea from "../Components/Inputs/TextArea";
import {modalAction} from "../ActionsAndReducers/Modal/Modal_ActionCreators";
import {saveSergeGameInformation, getSergeGameInformation} from "../ActionsAndReducers/sergeInfo/sergeInfo_ActionCreators";

class EditWelcomeScreen extends Component {

  constructor(props) {
    super(props);

    this.state = {
      title: this.props.gameInfo.title,
      description: this.props.gameInfo.description,
      showTitleEditIcon: false,
      showDescriptionEditIcon: false,
      editDescriptionMode: false,
    };

    this.props.dispatch(getSergeGameInformation());
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.props.gameInfo.title !== nextProps.gameInfo.title) {
      this.setState({
        title: nextProps.gameInfo.title,
      })
    }
    if (this.props.gameInfo.description !== nextProps.gameInfo.description) {
      this.setState({
        description: nextProps.gameInfo.description,
      })
    }
  }

  updateSergeTitle = (title) => {
    this.setState({
      title,
    })
  };

  updateDescription = (description) => {
    this.setState({
      description,
    })
  };

  mouseOverTitle = () => {
    this.setState({
      showTitleEditIcon: true,
    });
  };

  mouseOutTitle = () => {
    this.setState({
      showTitleEditIcon: false,
    });
  };

  editDescription = (e) => {
    e.stopPropagation();
    this.setState({
      editDescriptionMode: true,
    })
  };

  hideEditDescription = (e) => {
    e.stopPropagation();
    this.setState({
      editDescriptionMode: false,
    })
  };

  mouseOverDescription = () => {
    this.setState({
      showDescriptionEditIcon: true,
    })
  };

  mouseOutDescription = () => {
    this.setState({
      showDescriptionEditIcon: false,
    })
  };

  uploadImage = () => {
    this.props.dispatch(modalAction.open("uploadLogo"));
  };

  saveWelcomeScreen = () => {
    let info = {
      title: this.state.title,
      description: this.state.description,
      imageUrl: this.props.gameInfo.imageUrl,
    };
    this.props.dispatch(saveSergeGameInformation(info));
  };

  render() {

    return (
        <div className="flex-content-wrapper">
          <div id="sidebar_admin">
            <Link href={ADMIN_ROUTE} class="link link--large">Games</Link>
            <Link href={MESSAGE_TEMPLATE_ROUTE} class="link link--large">Message Templates</Link>
            <Link href={MESSAGE_LIBRARY_ROUTE} class="link link--large">Message Library</Link>
            <Link href={WELCOME_SCREEN_EDIT_ROUTE} class="link link--large link--active">Welcome Screen</Link>
          </div>
          <div className="flex-content flex-content--big flex-content--last welcome-page">
            <h1>Welcome Screen</h1>
            <span className="link link--noIcon welcome-screen-save" onClick={this.saveWelcomeScreen}>Save changes</span>
            <div className="flex-content flex-content--row">
              <h5>Image</h5>
              <span className="image-upload-link" onClick={this.uploadImage}>Upload new image</span>
            </div>
            <img className="serge-custom-logo" src={this.props.gameInfo.imageUrl} />
            <div className="section">
              <h5>Title</h5>
              <TextInput
                id="title-editable"
                updateStore={this.updateSergeTitle}
                options={{numInput: false}}
                data={this.state.title}
                onMouseOver={this.mouseOverTitle}
                onMouseOut={this.mouseOutTitle}
                title="Click to edit"
              />
              {this.state.showTitleEditIcon && <FontAwesomeIcon onMouseOver={this.mouseOverTitle} className="edit-hover-icon" icon={faPencilAlt} title="Edit Title" />}
            </div>
            <div className="description"
                 onMouseOver={this.mouseOverDescription}
                 onMouseOut={this.mouseOutDescription}
                 onClick={this.editDescription}
                 title="Click to edit"
            >
              {!this.state.editDescriptionMode &&
                <>
                  <h5>Text</h5>
                  {splitNewLineBreak(this.state.description)}
                  {this.state.showDescriptionEditIcon && <FontAwesomeIcon onMouseOver={this.mouseOverDescription} className="edit-hover-icon" icon={faPencilAlt} title="Edit Title" />}
                </>
              }

              {this.state.editDescriptionMode &&
                <>
                  <h5>Text</h5>
                  <TextArea
                    className="description-edit"
                    updateStore={this.updateDescription}
                    data={this.state.description}
                  />
                  <span
                    className="link link--noIcon"
                    onClick={this.hideEditDescription}
                  >Done</span>
                </>
              }
            </div>
          </div>
        </div>
    );
  }
}

const mapStateToProps = ({gameInfo}) => ({
  gameInfo,
});

export default connect(mapStateToProps)(EditWelcomeScreen);