import ActionConstant from '../ActionConstants';
import chat from "../../Schemas/chat.json";
import copyState from "../../Helpers/copyStateHelper";
import {CHAT_CHANNEL_ID} from "../../consts";
import _ from "lodash";
import uniqId from "uniqid";

const initialState = {
  selectedForce: '',
  forceColor: '',
  selectedRole: '',
  isObserver: false,
  controlUi: false,
  currentTurn: 1,
  phase: '',
  gameDate: '',
  gameTurnTime: 0,
  realtimeTurnTime: 0,
  turnEndTime: '',
  gameDescription: '',
  currentWargame: '',
  wargameTitle: '',
  chatChannel: {
    name: CHAT_CHANNEL_ID,
    template: chat,
    messages: [],
  },
  channels: {},
  allChannels: [],
  allForces: [],
  allTemplates: [],
  showObjective: false,
  wargameInitiated: false,
  feedbackMessages: [],
};

export const playerUiReducer = (state = initialState, action) => {

  let newState = copyState(state);

  let messages;
  let index;
  let channels = {};

  switch (action.type) {

    case ActionConstant.SET_CURRENT_WARGAME_PLAYER:

      newState.currentWargame = action.payload.name;
      newState.wargameTitle = action.payload.wargameTitle;
      newState.wargameInitiated = action.payload.wargameInitiated;
      newState.currentTurn = action.payload.gameTurn;
      newState.phase = action.payload.phase;
      newState.gameDate = action.payload.gameDate;
      newState.gameTurnTime = action.payload.gameTurnTime;
      newState.realtimeTurnTime = action.payload.realtimeTurnTime;
      newState.timeWarning = action.payload.timeWarning;
      newState.turnEndTime = action.payload.turnEndTime;
      newState.gameDescription = action.payload.data.overview.gameDescription;
      newState.allChannels = action.payload.data.channels.channels;
      newState.allForces = action.payload.data.forces.forces;
      break;

    case ActionConstant.SET_FORCE:
      newState.selectedForce = action.payload;
      newState.forceColor = newState.allForces.find((force) => force.uniqid === action.payload).color;
      break;

    case ActionConstant.SET_ROLE:
      newState.selectedRole = action.payload.name;
      newState.controlUi = action.payload.control;
      newState.isObserver = action.payload.isObserver;
      break;

    case ActionConstant.SET_ALL_TEMPLATES_PLAYERUI:
      newState.allTemplates = action.payload;
      break;

    case ActionConstant.SHOW_HIDE_OBJECTIVES:
      newState.showObjective = !newState.showObjective;
      break;

    case ActionConstant.SET_FEEDBACK_MESSAGES:
      newState.feedbackMessages = action.payload;
      break;

    case ActionConstant.SET_LATEST_FEEDBACK_MESSAGE:
      newState.feedbackMessages.unshift(action.payload);
      break;

    case ActionConstant.SET_LATEST_WARGAME_MESSAGE:

      if (action.payload.hasOwnProperty('infoType') && action.payload.phase === "planning") {
        let message = {
          details: {
            channel: `infoTypeChannelMarker${uniqId.time()}`
          },
          infoType: true,
          gameTurn: action.payload.gameTurn,
        };

        for (let channelId in newState.channels) {
          let matchedChannel = newState.allChannels.find((channel) => channel.uniqid === channelId);
          if (!matchedChannel) {
            delete newState.channels[channelId];
          } else {
            let channelActive = matchedChannel.participants.some((p) => p.forceUniqid === newState.selectedForce && p.roles.some((role) => role.value === newState.selectedRole));
            let allRoles = matchedChannel.participants.some((p) => p.forceUniqid === newState.selectedForce && p.roles.length === 0);
            if ((!channelActive || !allRoles) && !newState.isObserver) delete newState.channels[channelId];
          }
        }

        // create any new channels & add to current channel
        newState.allChannels.forEach((channel) => {

          let channelActive = channel.participants.some((p) => p.forceUniqid === newState.selectedForce && p.roles.some((role) => role.value === newState.selectedRole));
          let allRoles = channel.participants.some((p) => p.forceUniqid === newState.selectedForce && p.roles.length === 0);


          // rename channel
          if (
            (channelActive || allRoles) &&
            !!newState.channels[channel.uniqid]
          ) {
            newState.channels[channel.uniqid].name = channel.name;
          }

          // update observing status when observer removed from channel participants
          if (
            (!channelActive && !allRoles) &&
            newState.isObserver &&
            !!newState.channels[channel.uniqid]
          ) {
            newState.channels[channel.uniqid].observing = true;
          } else if (
            (channelActive || allRoles) &&
            newState.isObserver &&
            !!newState.channels[channel.uniqid]
          ) {
            newState.channels[channel.uniqid].observing = false;
          }

          // if channel already created
          if (
            (channelActive || allRoles) &&
            !!newState.channels[channel.uniqid] &&
            !newState.channels[channel.uniqid].messages.find((prevMessage) => prevMessage.gameTurn === message.gameTurn)
          ) {
            console.log('already created');
            console.log(newState.isObserver);
            newState.channels[channel.uniqid].messages.unshift(message);
            return;
          }

          // if no channel created yet
          if (
            (channelActive || allRoles) &&
            !newState.channels[channel.uniqid]
          )
          {
            let participatingRole = channel.participants.some((p) => p.forceUniqid === newState.selectedForce && p.roles.some((role) => role.value === newState.selectedRole));
            let participatingForce = channel.participants.find((p) => p.forceUniqid === newState.selectedForce);

            if (!participatingForce && !newState.isObserver) return;

            let isParticipant = !!participatingRole;
            let allRolesIncluded = channel.participants.some((p) => p.forceUniqid === newState.selectedForce && p.roles.length === 0);
            let chosenTemplates = participatingForce.templates;

            let templates;
            if (isParticipant || allRolesIncluded) {
              if (chosenTemplates.length === 0) {
                templates = newState.allTemplates.filter((template) => template.title === "Chat");
              }
              else {
                templates = chosenTemplates.map((template) => template.value);
              }
            }

            let observing = false;
            if (newState.isObserver && !isParticipant && !allRolesIncluded) {
              observing = true;
              templates = [];
            }

            if (allRolesIncluded || isParticipant || newState.isObserver) {
              channels[channel.uniqid] = {
                name: channel.name,
                templates,
                forceIcons: channel.participants.filter((participant) => participant.forceUniqid !== newState.selectedForce).map((participant) => participant.icon),
                messages: [],
                unreadMessageCount: 0,
                observing,
              };
            }
            newState.channels = _.defaults(channels, newState.channels);
          }

        });

      } else if (!action.payload.hasOwnProperty('infoType')) {

        if (action.payload.details.channel === CHAT_CHANNEL_ID)
        {
          newState.chatChannel.messages.unshift(action.payload);
        }
        else if (!!newState.channels[action.payload.details.channel])
        {
          newState.channels[action.payload.details.channel].messages.unshift({...action.payload, hasBeenRead: false, isOpen: false});
          newState.channels[action.payload.details.channel].unreadMessageCount++;
        }
      }

      break;

    case ActionConstant.SET_ALL_MESSAGES:

      messages = action.payload.map((message) => {
        if (message.hasOwnProperty('infoType')) {
          return {
            details: {
              channel: `infoTypeChannelMarker${uniqId.time()}`
            },
            infoType: true,
            gameTurn: message.gameTurn,
          }
        }
        return {...message, hasBeenRead: false, isOpen: false};
      });

      let reduceTurnMarkers = (message) => {
        if (message.infoType) {
          return message.gameTurn;
        } else {
          return message._id;
        }
      };

      messages = _.uniqBy(messages, reduceTurnMarkers);

      newState.chatChannel.messages = messages.filter((message) => message.details.channel === newState.chatChannel.name);

      newState.allChannels.forEach((channel) => {

        let participatingRole = channel.participants.some((p) => p.forceUniqid === newState.selectedForce && p.roles.some((role) => role.value === newState.selectedRole));
        let participatingForce = channel.participants.find((p) => p.forceUniqid === newState.selectedForce);

        if (!participatingForce && !newState.isObserver) return;

        let isParticipant = !!participatingRole;
        let allRolesIncluded = channel.participants.some((p) => p.forceUniqid === newState.selectedForce && p.roles.length === 0);

        let chosenTemplates;
        if (!!participatingForce) {
          chosenTemplates = participatingForce.templates;
        } else {
          chosenTemplates = [];
        }

        let templates;
        if (isParticipant || allRolesIncluded) {
          if (chosenTemplates.length === 0) {
            templates = newState.allTemplates.filter((template) => template.title === "Chat");
          }
          else {
            templates = chosenTemplates.map((template) => template.value);
          }
        }

        let observing = false;
        if (newState.isObserver && !isParticipant && !allRolesIncluded) {
          observing = true;
          templates = [];
        }

        if (!newState.isObserver && !isParticipant && !allRolesIncluded) return;


        if (allRolesIncluded || isParticipant || newState.isObserver) {
          channels[channel.uniqid] = {
            name: channel.name,
            templates,
            forceIcons: channel.participants.filter((participant) => participant.forceUniqid !== newState.selectedForce).map((participant) => participant.icon),
            messages: messages.filter((message) => message.details.channel === channel.uniqid || message.infoType === true),
            unreadMessageCount: messages.filter((message) => message.details.channel === channel.uniqid).length,
            observing,
          };
        }

        newState.channels = channels;

      });

      break;

    case ActionConstant.OPEN_MESSAGE:

      messages = newState.channels[action.payload.channel].messages;

      action.payload.message.isOpen = true;
      action.payload.message.hasBeenRead = true;
      index = messages.findIndex((item) => item._id === action.payload.message._id);
      messages.splice(index, 1, action.payload.message);
      newState.channels[action.payload.channel].messages = messages;

      let unreadMessages = newState.channels[action.payload.channel].messages.filter((message) => {
        return !message.hasOwnProperty("infoType") && !message.hasBeenRead;
      });

      newState.channels[action.payload.channel].unreadMessageCount = unreadMessages.length;

      break;

    case ActionConstant.CLOSE_MESSAGE:

      messages = newState.channels[action.payload.channel].messages;
      action.payload.message.isOpen = false;
      index = messages.findIndex((item) => item._id === action.payload.message._id);
      messages.splice(index, 1, action.payload.message);
      newState.channels[action.payload.channel].messages = messages;

      break;

    case ActionConstant.MARK_ALL_AS_READ:

      newState.channels[action.payload].messages.forEach((message) => {
        if (message.hasOwnProperty("hasBeenRead")) message.hasBeenRead = true;
      });
      newState.channels[action.payload].unreadMessageCount = 0;

      break;

    default:
      return newState;
  }

  return newState;
};
