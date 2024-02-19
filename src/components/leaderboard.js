
const pr = require('profane-words');


const NUM_SCORES_DISPLAYED = 10;
const ba = /(fuc)|(ass)|(nig)|(shit)|(retard)/gi;

/**
 * High score with Firebase cloud store.
 * Index: challengeId ASC difficulty ASC score DESC time ASC
 */
AFRAME.registerComponent('leaderboard', {
  schema: {
    apiKey: { type: 'string' },
    authDomain: { type: 'string' },
    databaseURL: { type: 'string' },
    projectId: { type: 'string' },
    storageBucket: { type: 'string' },
    messagingSenderId: { type: 'string' },

    challengeId: { default: '' },
    difficulty: { default: '' },
    beatmapCharacteristic: { default: '' },
    inVR: { default: false },
    gameMode: { type: 'string' },
    menuSelectedChallengeId: { default: '' },
    isVictory: { default: false }
  },

  init: function () {
    this.qualifyingIndex = undefined;
    this.scores = [];
    this.eventDetail = { scores: this.scores };
    this.addEventDetail = { scoreData: undefined, index: undefined };

    this.username = localStorage.getItem('moonriderusername') || 'Super Zealot';
    this.el.addEventListener('leaderboardusername', evt => {
      this.username = evt.detail.value;
      localStorage.setItem('moonriderusername', this.username);
    });
    this.el.addEventListener('leaderboardsubmit', this.addScore.bind(this));
  },

  update: function (oldData) {

    if (!oldData.isVictory && this.data.isVictory) {
      this.checkLeaderboardQualify();
    }

    if (this.data.difficulty && oldData.difficulty !== this.data.difficulty) {
      this.fetchScores(this.data.menuSelectedChallengeId);
      return;
    }

    if (this.data.beatmapCharacteristic && oldData.beatmapCharacteristic !== this.data.beatmapCharacteristic) {
      this.fetchScores(this.data.menuSelectedChallengeId);
      return;
    }

    if (this.data.menuSelectedChallengeId &&
      oldData.menuSelectedChallengeId !== this.data.menuSelectedChallengeId) {
      this.fetchScores(this.data.menuSelectedChallengeId);
      return;
    }

    if (this.data.challengeId && oldData.challengeId !== this.data.challengeId) {
      this.fetchScores(this.data.challengeId);
      return;
    }
  },

  sortScores: function () {
    this.scores = this.scores.sort((a, b) => { return b.score - a.score });
    // return scores.sort(function compareFn(a, b) { b.score - a.score });
  },

  addScore: function () {
    // console.log('addScore');
    const state = this.el.sceneEl.systems.state.state;

    if (!state.isVictory || !state.inVR) { return; }

    const scoreData = {
      accuracy: state.score.accuracy,
      challengeId: state.challenge.id,
      gameMode: this.data.gameMode,
      score: state.score.score,
      username: this.username,
      difficulty: this.data.difficulty || state.challenge.difficulty,
      beatmapCharacteristic: this.data.beatmapCharacteristic || state.challenge.beatmapCharacteristic,
      time: new Date()
    };

    // console.log(scoreData);

    if (!pr.includes(this.username.toLowerCase()) &&
      !this.username.match(ba)) {
      // this.db.add(scoreData);

      const datakey = `skyrider/leaderboard/${state.challenge.id}/${this.data.gameMode}/${this.data.beatmapCharacteristic || state.challenge.beatmapCharacteristic}/${this.data.difficulty || state.challenge.difficulty}`;

      window.skynetClient.db.getJSON(window.publicKey, datakey).then(m => {
        var scores = m.data || [];

        scores.push(scoreData);

        this.scores = scores;


        window.skynetClient.db.setJSON(window.privateKey, datakey, scores).then(m => {
          this.sortScores();
          this.eventDetail.challengeId = state.challenge.id;
          this.eventDetail.scores = this.scores;
          this.el.sceneEl.emit('leaderboard', this.eventDetail, false);

          /* this.addEventDetail.scoreData = scoreData;
          this.el.emit('leaderboardscoreadded', this.addEventDetail, false); */
        })

        const datakey2 = `skyrider/leaderboard-index`;

        window.skynetClient.db.getJSON(window.publicKey, datakey2).then(m => {
          var leaderboards = m.data || [];

          leaderboards.push(datakey);

          window.skynetClient.db.setJSON(window.privateKey, datakey2, leaderboards)
        })
      })
    }

  },

  fetchScores: function (challengeId) {
    if (this.data.gameMode === 'ride') { return; }

    const state = this.el.sceneEl.systems.state.state;
    /*    const query = this.db
     .where('challengeId', '==', challengeId)
     .where(
       'difficulty', '==',
       state.menuSelectedChallenge.id
         ? state.menuSelectedChallenge.difficulty
         : state.challenge.difficulty)
     .where('gameMode', '==', this.data.gameMode)
     .orderBy('score', 'desc')
     .orderBy('time', 'asc')
     .limit(10); */
    this.eventDetail.challengeId = challengeId;

    window.skynetClient.db.getJSON(window.publicKey, `skyrider/leaderboard/${challengeId}/${this.data.gameMode}/${state.menuSelectedChallenge.id
      ? state.menuSelectedChallenge.beatmapCharacteristic
      : state.challenge.beatmapCharacteristic}/${state.menuSelectedChallenge.id
        ? state.menuSelectedChallenge.difficulty
        : state.challenge.difficulty}`).then(m => {
          this.scores.length = 0;
          this.scores = m.data || [];
          this.sortScores();
          // TODO Sort
          // console.log('scores', this.scores);
          this.eventDetail.challengeId = challengeId;
          this.eventDetail.scores = this.scores;
          this.el.sceneEl.emit('leaderboard', this.eventDetail, false);
        })
    // this.scores.length = 0;

    /* if (!snapshot.empty) {
      snapshot.forEach(score => this.scores.push(score.data()));
    } */


    /*   query.get().then(snapshot => {
        this.eventDetail.challengeId = challengeId;
        this.scores.length = 0;
        if (!snapshot.empty) {
          snapshot.forEach(score => this.scores.push(score.data()));
        }
        this.el.sceneEl.emit('leaderboard', this.eventDetail, false);
      }).catch(e => {
        console.error('[firestore]', e);
      }); */
  },

  /**
   * Is high score?
   */
  checkLeaderboardQualify: function () {
    const state = this.el.sceneEl.systems.state.state;
    const score = state.score.score;

    if (AFRAME.utils.getUrlParameter('dot')) { return; }

    // If less than 10, then automatic high score.
    if (this.scores.length < NUM_SCORES_DISPLAYED) {
      this.qualifyingIndex = this.scores.length;
      this.el.sceneEl.emit('leaderboardqualify', this.scores.length, false);
      return;
    }

    // Check if overtook any existing high score.
    for (let i = 0; i < this.scores.length; i++) {
      if (score > this.scores[i].score) {
        this.qualifyingIndex = i;
        this.el.sceneEl.emit('leaderboardqualify', i, false);
        return;
      }
    }
  }
});
