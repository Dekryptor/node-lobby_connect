"use strict";

const path = require('path');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const StructType = require('ref-struct-di')(ref);

const Player = StructType({
    name: ref.types.CString,
    appID: ref.types.int,
    connect: ref.types.CString,
    lobby: ref.types.uint64
});

const lib = ffi.Library(path.join(__dirname, 'lib', `lobby_connect_${(process.arch === "x64") ? 'x64' : 'x86'}.dll`), {
   'lobby_ready': ["int", ["int"]],
   'lobby_player_count': ["int", []],
   'lobby_player_info': [Player, ["int"]]
});

const lobby = {
  ready: function(delay = 200){
    return new Promise((resolve,reject) => {
      lib.lobby_ready.async(delay,function (err, res) {
          if(err) {
            return reject(err);
          } else {
            return resolve(res);
          }
      });
    });
  },
  playerCount: function(){
    return new Promise((resolve,reject) => {
      lib.lobby_player_count.async(function (err, res) {
          if(err) {
            return reject(err);
          } else {
            return resolve(res);
          }
      });
    });
  },
  playerInfo: function(i){
    return new Promise((resolve,reject) => {
      lib.lobby_player_info.async(i,function (err, res) {
          if(err) {
            return reject(err);
          } else {
            return resolve(res);
          }
      });
    });
  }
};

module.exports = async() => {
  if (await lobby.ready()) 
  {
    
    let players = [];
      
    for (let i=0; i < await lobby.playerCount(); i++) 
    {
      let player = await lobby.playerInfo(i);
      players.push({
        name: player.name,
        appID: player.appID,
        connect: (player.connect.length == 0 && player.lobby) ? `+connect_lobby ${player.lobby}` : player.connect
      });
    }

    return players;
      
   } 
   else 
   {
    throw "SteamAPI not ready";
   }
}
