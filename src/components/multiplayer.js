AFRAME.registerComponent('multiplayer', {
  schema: {
    userId: { type: 'string' },

  },

  init: function () {

    sceneEl = this.el.sceneEl;

    if (!window.multiplayerEnabled) { return; }

    console.log('multiplayer/init');

    window.readyPlayers = [];

    NAF.connection.subscribeToDataChannel('menuchallengeselect', function (senderId, dataType, data, targetId) {
      console.log('multiplayer/menuchallengeselect', data)

      fetch(`https://beatsaver.com/api/maps/detail/${data}`)
        .then(r => { return r.json() })
        .then(res => {
          window.challengeDataStore[data] = window.convertBeatsaverToMoonrider(res)

          /* console.log('multiplayer/menuchallengeselect2', window.challengeDataStore[data])
          console.log(this.el);
          console.log(this.sceneEl); */


          sceneEl.emit(
            'menuchallengeselect',
            data,
            false);
        });
    })

    NAF.connection.subscribeToDataChannel('menudifficultyselect', function (senderId, dataType, data, targetId) {
      console.log('multiplayer/menudifficultyselect', data)

      sceneEl.emit(
        'menudifficultyselect',
        data,
        false);

    })
    NAF.connection.subscribeToDataChannel('playbuttonclick', function (senderId, dataType, data, targetId) {
      console.log('multiplayer/playbuttonclick')

      sceneEl.emit(
        'playbuttonclick',
        null,
        false);

    })
    NAF.connection.subscribeToDataChannel('livescoredata', function (senderId, dataType, data, targetId) {
      console.log('multiplayer/livescoredata')

      sceneEl.emit(
        'multiplayerscoreupdate',
        data,
        false);
    })


    NAF.connection.subscribeToDataChannel('setmodeoption', function (senderId, dataType, data, targetId) {
      console.log('multiplayer/setmodeoption', data)

      document.querySelector('[menu-mode]').emit('setmodeoption', data)
    })

    NAF.connection.subscribeToDataChannel('songprocessfinish', function (senderId, dataType, data, targetId) {
      console.log('multiplayer/songprocessfinish', senderId)
      window.readyPlayers.push(senderId);

      if (window.readyPlayers.length > Object.keys(NAF.connection.connectedClients).length) {
        sceneEl.emit(
          'songprocessfinishmultiplayer',
          data,
          false);
      }
    })



    /* this.el.sceneEl.emit(
      'menudifficultyselect',
      evt.target.closest('.difficultyOption').dataset.difficulty,
      false); */


  },

});
