import uniqid from "uniqid";
import _ from "lodash";
import {fetch} from "whatwg-fetch";

import deepCopy from "../Helpers/copyStateHelper";

import calcComplete from "../Helpers/calcComplete";

import PouchDB from "pouchdb";
import {  databasePath,
  serverPath,
  dbDefaultSettings,
  MSG_STORE,
  MSG_TYPE_STORE
} from "./consts";

import {setWargameMessages} from "../ActionsAndReducers/playerUi/playerUi_ActionCreators";


var wargameDbStore = [];


const changesListener = (db, name, dispatch) => {
  db.changes({since: 'now', live: true, timeout: false, heartbeat: false})
    .on('change', function () {
      (async () => {
        let messages = await getAllMessages(name);
        dispatch(setWargameMessages(messages));
      })();
    })
    .on('error', function (err) {
      console.log(err);
      changesListener(db, name, dispatch);
    });
};

export const populateWargame = (dispatch) => {
  return fetch(serverPath+'allDbs')
    .then((response) => {
      return response.json();
    })
    .then((dbs) => {
      let wargameNames = wargameDbStore.map((db) => db.name);
      let toCreate = _.difference(dbs, wargameNames);
      toCreate = _.pull(toCreate, MSG_STORE, MSG_TYPE_STORE, "_replicator", "_users");

      toCreate.forEach((name) => {
        var db = new PouchDB(databasePath+name);
        db.setMaxListeners(15);

        changesListener(db, name, dispatch);

        wargameDbStore.unshift({name, db});
      });

      let promises = wargameDbStore.map((game) => {
        return game.db.get(dbDefaultSettings._id)
          .then(function (res) {
            return {
              name: game.db.name,
              title: res.wargameTitle
            }
          })
          .catch((err) => {
            console.log(err);
          });
      });
      return Promise.all(promises);
    })
    .catch((err) => {
      console.log(err);
    });
};

export const clearWargames = () => {
  fetch(serverPath+'clearAll')
    .then(() => {
      window.location.reload(true);
    });
};

export const deleteWargame = (wargamePath) => {

  let name = getNameFromPath(wargamePath);

  let wargame = wargameDbStore.find((item) => item.name === name);
      wargame.db.destroy();
        // .then(() => {
        //   return fetch(serverPath+'deleteDb?db='+name);
        // })
        // .then((res) => {
        //   console.log(res);
        // })
        // .catch((err) => {
        //   console.log(err);
        // });


  let index = wargameDbStore.findIndex((item) => item.name === name);
  wargameDbStore.splice(index, 1);
};

export const createWargame = (dispatch) => {
  let uniqId = uniqid.time();

  var name = `wargame-${uniqId}`;

  return new Promise((resolve, reject) => {

    let db = new PouchDB(databasePath+name);

    db.setMaxListeners(15);
    changesListener(db, name, dispatch);

    wargameDbStore.unshift({name, db});

    let settings = {...dbDefaultSettings, name: name};

    settings.wargameTitle = name;

    db.put(settings)
      .then(() => {
        return db.get(settings._id);
      })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
        console.log(err);
      })
  });
};

export const editWargame = (dbPath) => {

  let dbName = getNameFromPath(dbPath);

  return new Promise((resolve, reject) => {
    try {
      var db = wargameDbStore.find((db) => db.name === dbName).db;
      db.get(dbDefaultSettings._id)
        .then((res) => {
          resolve(res);
        });
    } catch (err) {
      reject(err);
    }
  });
};

export const updateWargameTitle = (dbName, title) => {

  return getAllWargames()
    .then(function (games) {
      if (games.some((game) => game.title === title && getNameFromPath(game.name) !== dbName)) return 'Name already in use.';

      var db = wargameDbStore.find((db) => db.name === dbName).db;

      return new Promise((resolve, reject) => {

        db.get(dbDefaultSettings._id)
          .then((res) => {
            db.put({
              _id: dbDefaultSettings._id,
              _rev: res._rev,
              name: dbName,
              wargameTitle: title,
              data: res.data,
            })
              .then(() => {
                resolve(db.get(dbDefaultSettings._id));
              })
              .catch((err) => {
                reject(err);
              })
          });
      });


    })
    .catch(function (err) {
      return err;
    });
};

export const saveSettings = (dbName, data) => {

  let db = wargameDbStore.find((wargame) => dbName === wargame.name).db;

  return new Promise((resolve, reject) => {

    getWargameLocalFromName(dbName)
      .then(function (localDoc) {
        let newDoc = deepCopy(localDoc);
        newDoc.data.overview = data;
        newDoc.data.overview.complete = calcComplete(data);
        return newDoc;
      })
      .then((res) => {
        return db.put({
          _id: res._id,
          _rev: res._rev,
          name: res.name,
          wargameTitle: res.wargameTitle,
          data: res.data,
        })
      })
      .then(() => {
        resolve(db.get(dbDefaultSettings._id));
      })
      .catch((err) => {
        reject(err);
      })
  });
};

export const saveForce = (dbName, newName, newData, oldName) => {

  let db = wargameDbStore.find((wargame) => dbName === wargame.name).db;

  return getWargameLocalFromName(dbName)
    .then(function (localDoc) {

      let newDoc = deepCopy(localDoc);

      let updatedData = newDoc.data;

      let forces = updatedData.forces.forces;

      let forceNew = forces.every((force) => force.forceName !== oldName);

      if (forceNew) {
        forces.push({...newData, forceName: newName});
      } else {
        let forceIndex = forces.findIndex((force) => force.forceName === oldName);
        // forces.forceName = newName;
        forces.splice(forceIndex, 1, {...newData, forceName: newName});
      }

      updatedData.forces.forces = forces;
      updatedData.forces.complete = calcComplete(forces);

      return new Promise((resolve, reject) => {

        db.get(dbDefaultSettings._id)
          .then((res) => {
            db.put({
              _id: dbDefaultSettings._id,
              _rev: res._rev,
              name: res.name,
              wargameTitle: res.wargameTitle,
              data: updatedData,
            })
              .then(() => {
                resolve(db.get(dbDefaultSettings._id));
              })
              .catch((err) => {
                reject(err);
              })
          });
      });
    });
};



export const saveChannel = (dbName, newName, newData, oldName) => {

  let db = wargameDbStore.find((wargame) => dbName === wargame.name).db;
  //
  return getWargameLocalFromName(dbName)
    .then(function (localDoc) {

      let newDoc = deepCopy(localDoc);

      let updatedData = newDoc.data;

      let channels = updatedData.channels.channels;

      let channelNew = channels.every((channel) => channel.channelName !== oldName);

      if (channelNew) {
        channels.push({...newData, channelName: newName});
      } else {
        let channelIndex = channels.findIndex((channel) => channel.channelName === oldName);
        // channels.channelName = newName;
        channels.splice(channelIndex, 1, {...newData, channelName: newName});
      }

      updatedData.channels.channels = channels;
      updatedData.channels.complete = calcComplete(channels);

      return new Promise((resolve, reject) => {

        db.get(dbDefaultSettings._id)
          .then((res) => {
            db.put({
              _id: dbDefaultSettings._id,
              _rev: res._rev,
              name: res.name,
              wargameTitle: res.wargameTitle,
              data: updatedData,
            })
              .then(() => {
                resolve(db.get(dbDefaultSettings._id));
              })
              .catch((err) => {
                reject(err);
              })
          });
      });
    })
};


export const deleteChannel = (dbName, channelName) => {

  let db = wargameDbStore.find((wargame) => dbName === wargame.name).db;
  //
  return getWargameLocalFromName(dbName)
    .then(function (localDoc) {

      let newDoc = deepCopy(localDoc);

      let updatedData = newDoc.data;

      let channels = updatedData.channels.channels;

      let channelIndex = channels.findIndex((channel) => channel.channelName === channelName);

        channels.splice(channelIndex, 1);

      updatedData.channels.channels = channels;
      updatedData.channels.complete = calcComplete(channels);

      return new Promise((resolve, reject) => {

        db.get(dbDefaultSettings._id)
          .then((res) => {
            db.put({
              _id: dbDefaultSettings._id,
              _rev: res._rev,
              name: res.name,
              wargameTitle: res.wargameTitle,
              data: updatedData,
            })
              .then(() => {
                resolve(db.get(dbDefaultSettings._id));
              })
              .catch((err) => {
                reject(err);
              })
          });
      });
    })
};

export const deleteForce = (dbName, forceName) => {

  let db = wargameDbStore.find((wargame) => dbName === wargame.name).db;
  //
  return getWargameLocalFromName(dbName)
    .then(function (localDoc) {

      let newDoc = deepCopy(localDoc);

      let updatedData = newDoc.data;

      let forces = updatedData.forces.forces;

      let forceIndex = forces.findIndex((force) => force.forceName === forceName);

      forces.splice(forceIndex, 1);

      updatedData.forces.forces = forces;
      updatedData.channels.complete = calcComplete(forces);

      return new Promise((resolve, reject) => {

        db.get(dbDefaultSettings._id)
          .then((res) => {
            db.put({
              _id: dbDefaultSettings._id,
              _rev: res._rev,
              name: res.name,
              wargameTitle: res.wargameTitle,
              data: updatedData,
            })
              .then(() => {
                resolve(db.get(dbDefaultSettings._id));
              })
              .catch((err) => {
                reject(err);
              })
          });
      });
    })
};


export const duplicateWargame = (dbPath) => {

  let dbName = getNameFromPath(dbPath);

  let db = wargameDbStore.find((db) => db.name === dbName).db;
  let uniqId = uniqid.time();

  return new Promise((resolve, reject) => {

    var newDb;
    var newDbName = `wargame-${uniqId}`;

    db.get(dbDefaultSettings._id)
      .then((res) => {
        newDb = new PouchDB(databasePath+newDbName);
        return res;
      })
      .then((res) => {
        return newDb.put({
          _id: dbDefaultSettings._id,
          name: newDbName,
          wargameTitle: `${res.wargameTitle}-${uniqId}`,
          data: res.data,
        })
          .then(() => {
            return res;
          })
      })
      .then(() => {
        wargameDbStore.unshift({name: newDbName, db: newDb});
        return getAllWargames();
      })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
        console.log(err);
      })
  });
};

export const getWargameLocalFromName = (dbName) => {

  let game = wargameDbStore.find((wargame) => dbName === wargame.name);

  return new Promise((resolve, reject) => {
    game.db.get(dbDefaultSettings._id)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      })
  });
};

export const getWargame = (gamePath) => {

  let name = getNameFromPath(gamePath);

  let game = wargameDbStore.find((wargame) => name === wargame.name);

  return new Promise((resolve, reject) => {
    game.db.get(dbDefaultSettings._id)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      })
  });
};

export const postNewMessage = (dbName, details, message) => {

  let db = wargameDbStore.find((db) => db.name === dbName).db;

  return new Promise((resolve, reject) => {

    db.put({
      _id: new Date().toISOString(),
      details,
      message,
    })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        console.log(err);
      })
  });
};

export const getAllMessages = (dbName) => {

  let db = wargameDbStore.find((db) => db.name === dbName).db;

  return new Promise((resolve, reject) => {

    db.allDocs({include_docs: true, descending: true})
      .then((res) => {
        resolve(res.rows.map((a) => a.doc));
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export var getAllWargames = function () {

  let promises = wargameDbStore.map((game) => {
    return game.db.get(dbDefaultSettings._id)
      .then(function (res) {
        return {
          name: game.db.name,
          title: res.wargameTitle
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
  return Promise.all(promises);
};

var getNameFromPath = function (dbPath) {
  let path = new URL(dbPath).pathname;
  let index = path.lastIndexOf('/');
  return path.substring(index + 1);
};
