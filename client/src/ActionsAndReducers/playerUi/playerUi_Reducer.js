import ActionConstant from '../ActionConstants';
import chat from "../../Schemas/chat.json";
import copyState from "../../Helpers/copyStateHelper";
import {CHAT_CHANNEL_ID} from "../../api/consts";
import _ from "lodash";
import uniqId from "uniqid";

const initialState = {
  selectedForce: '',
  selectedRole: '',
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
  allMessages: [],
  allForces: [],
  showObjective: false,
  wargameInitiated: false,
  feedbackMessages: [],
};

export const playerUiReducer = (state = initialState, action) => {

  let newState = copyState(state);

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
      break;

    case ActionConstant.SET_ROLE:
      newState.selectedRole = action.payload.name;
      newState.controlUi = action.payload.control;
      break;

    case ActionConstant.SHOW_HIDE_OBJECTIVES:
      newState.showObjective = !newState.showObjective;
      break;

    case ActionConstant.SET_FEEDBACK_MESSAGES:
      newState.feedbackMessages = action.payload;
      break;

    case ActionConstant.SET_LATEST_MESSAGES:

      let channels = {};

      newState.allMessages = action.payload;

      let messages = action.payload.map((message) => {
        if (message.hasOwnProperty('infoType')) {
          return {
            details: {
              channel: `infoTypeChannelMarker${uniqId.time()}`
            },
            infoType: true,
            gameTurn: message.gameTurn,
          }
        }
        return message;
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

        let participants = channel.participants.filter((p) => p.forceUniqid === newState.selectedForce && p.roles.some((role) => role.value === newState.selectedRole));
        let channelActive = channel.participants.some((p) => p.forceUniqid === newState.selectedForce && p.roles.some((role) => role.value === newState.selectedRole));

        if (channelActive) {
          channels[channel.uniqid] = {
            name: channel.name,
            templates: _.flatMap(participants, (participant) => participant.templates),
            forceIcons: channel.participants.filter((participant) => participant.forceUniqid !== newState.selectedForce).map((participant) => participant.icon),
            messages: messages.filter((message) => message.details.channel === channel.uniqid || message.infoType === true),
          };
        }

        newState.channels = channels;

      });

      break;

    default:
      return newState;
  }

  return newState;
};
