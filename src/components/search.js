const debounce = require('lodash.debounce');


const topSearch = require('../lib/search.json');

const filters = [];

/**
 * Search (including the initial list of popular searches).
 * Attached to super-keyboard.
 */
AFRAME.registerComponent('search', {
  schema: {
    difficultyFilter: { default: 'All' },
    genre: { default: '' },
    playlist: { default: '' },
    query: { default: '' }
  },

  init: function () {
    const topSearch2 = topSearch.map(window.convertBeatsaverToMoonrider);
    this.eventDetail = { query: '', results: topSearch2 };
    this.keyboardEl = document.getElementById('keyboard');
    this.popularHits = topSearch2;
    shuffle(this.popularHits);
    this.queryObject = { hitsPerPage: 0, query: '' };
    this.el.sceneEl.addEventListener('searchclear', () => { this.search(''); });
  },

  update: function (oldData) {
    if (!this.popularHits) { return; }  // First load.

    this.search(this.data.query);

    // Clear keyboard.
    if (oldData.query && !this.data.query) {
      this.keyboardEl.components['super-keyboard'].data.value = '';
      this.keyboardEl.components['super-keyboard'].updateTextInput('');
    }

    this.debouncedSearch = debounce(this.search.bind(this), 1000);
  },

  play: function () {
    // Pre-populate top.
    this.el.sceneEl.emit('searchresults', this.eventDetail);

    // Populate popular.
    this.search('');
  },

  events: {
    superkeyboardchange: function (evt) {
      if (evt.target !== this.el) { return; }
      this.debouncedSearch(evt.detail.value);
    }
  },

  search: function (query) {

    // Use cached for popular hits.
    if (!query && this.data.difficultyFilter === 'All' && !this.data.genre &&
      !this.data.playlist && this.popularHits) {
      this.eventDetail.results = this.popularHits;
      this.eventDetail.query = '';
      this.el.sceneEl.emit('searchresults', this.eventDetail);
      return;
    }

    this.eventDetail.query = query;
    this.queryObject.query = query;
    this.queryObject.hitsPerPage = query ? 30 : 150;

    // Favorites.
    if (this.data.playlist === 'favorites') {
      // console.log('load favorites 1');

      (async () => {

        console.log('load favorites');

        window.state.searchResultsPage = [];


        try {
          const res = await window.mySky.getJSONEncrypted('skyrider.hns/playlists/favorites.json')

          console.log('load favorites', res);
          // console.log('res', res);

          this.eventDetail.results = res.data === null ? [] : res.data//JSON.parse(localStorage.getItem('favorites'));
        } catch (e) {
          throw e;
          this.eventDetail.results = [];
        }
        // console.log('done load favorites', this.eventDetail.results);

        this.el.sceneEl.emit('searchresults', this.eventDetail);


        /* this.eventDetail.results = content.hits;
        this.el.sceneEl.emit('searchresults', this.eventDetail); */


      })();


      return;
    }

    if (this.data.difficultyFilter || this.data.playlist) {
      filters.length = 0;

      // Difficulty filter.
      if (this.data.difficultyFilter && this.data.difficultyFilter !== 'All') {
        filters.push(`difficulties:"${this.data.difficultyFilter}"`);
      }

      // Genre filter.
      /*    if (this.data.genre === 'Video Games') {
           filters.push(`genre:"Video Game" OR genre:"Video Games"`);
         } else if (this.data.genre) {
           filters.push(`genre:"${this.data.genre}"`);
         } */
      // console.log('playlist', this.data.playlist)

      // Playlist filter.
      if (this.data.playlist) {
        fetch(`/assets/data/playlists/${this.data.playlist}.json`)
          .then(r => { return r.json() })
          .then(res => {
            // console.log('fetch', res);

            this.eventDetail.results = res.map(window.convertBeatsaverToMoonrider);

            this.el.sceneEl.emit('searchresults', this.eventDetail);
          })
        return;
        filters.push(`playlists:"${this.data.playlist}"`);
      }

      this.queryObject.filters = filters.join(' AND ');
    } else {
      delete this.queryObject.filters;
    }

    if (this.data.genre) {

      const genreMap = {
        'Pop': 'pop',
        'R&B': 'rb',
        'Rap': 'hip-hop-rap',
        'Rock': 'rock',
        'Soundtrack': 'tv-movie-soundtrack',
        'Video Games': 'video-game-soundtrack',
        'Electronic': 'electronic',
        'Hip Hop': 'hip-hop-rap',
        'House': 'house',
        'J-Pop': 'j-pop',
        'K-Pop': 'k-pop',
        'Meme': 'comedy-meme',
        'Alternative': 'alternative',
        'Anime': 'anime',
        'Comedy': 'comedy-meme',

        'Dubstep': 'dubstep',
        'Dance': 'dance',
      };

      console.log('searchgenre', this.data.genre);

      const tag = genreMap[this.data.genre];

      console.log('searchtag', tag);
      window.currentSearchPage = 0;
      window.currentSearchUrl = `https://beatsaver.com/api/search/text/CURRENT_PAGE_INDEX?sortOrder=Rating&tags=${encodeURIComponent(tag)}`;

      fetch(window.currentSearchUrl.replaceAll('CURRENT_PAGE_INDEX', 0))
        .then(r => { return r.json() })
        .then(res => {
          // console.log('fetch', res);

          var hits = res['docs'].map(window.convertBeatsaverToMoonrider)
          console.log('results', hits);

          this.eventDetail.results = hits;

          this.el.sceneEl.emit('searchresults', this.eventDetail);
        })
      return;
    }

    if (query && query.length < 3) { return; }
    /* console.log(query);
    console.log(this.queryObject); */



    window.currentSearchPage = 0;
    window.currentSearchUrl = `https://beatsaver.com/api/search/text/CURRENT_PAGE_INDEX?sortOrder=Rating&q=${encodeURIComponent(query)}`;

    // 
    // fetch(`https://beatsaver.com/api/search/text/0?q=${encodeURIComponent(query)}&sortOrder=Relevance`)
    fetch(window.currentSearchUrl.replaceAll('CURRENT_PAGE_INDEX', 0))
      .then(r => { return r.json() })
      .then(res => {
        // console.log('fetch', res);

        var hits = res['docs'].map(window.convertBeatsaverToMoonrider)
        console.log('results', hits);

        this.eventDetail.results = hits;

        this.el.sceneEl.emit('searchresults', this.eventDetail);
      })
  }
});

/**
 * Click listener for search result.
 */
AFRAME.registerComponent('search-result-list', {
  init: function () {
    const obv = new MutationObserver(mutations => {
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === 'data-index') {
          this.refreshLayout();
        }
      }
    });
    obv.observe(this.el, { attributes: true, childList: false, subtree: true });
  },

  events: {
    click: function (evt) {
      if (window.multiplayerEnabled) {
        console.log('multiplayer/broadcast/menuchallengeselect', evt.target.closest('.searchResult').dataset.id)
        NAF.connection.broadcastDataGuaranteed('menuchallengeselect', evt.target.closest('.searchResult').dataset.id);
      }

      this.el.sceneEl.emit(
        'menuchallengeselect',
        evt.target.closest('.searchResult').dataset.id,
        false);
    }
  },

  refreshLayout: function () {
    this.el.emit('layoutrefresh', null, false);
  }
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
