'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const hl = require('highland');
const R = require('ramda');
const JSONStream = require('JSONStream');
const path = require('path');
const request = require('superagent');
const geohash = require('ngeohash');

// Constants
const PORT = process.env.PORT || 2327;
//const JUICER_API_KEY = 'iCNGx8l4R3Pf2ge9itNAvz3MXOVK9lyG';
const HIVE_URL = 'https://hivealpha.com/api/author-info';

const app = express();

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/api/validate', (req, res) => {
  hl(request.get(HIVE_URL)
      .query({auth: 'trust'})
      .query({author: 'Kevin Maguire'})
      .then(R.prop('body')))
      .toCallback((err, data) => {
          const locations = R.pathOr([], ['aggregations', 'geohash_1', 'geohash_2', 'geohash_3', 'buckets'], data);
          const article = R.compose(R.propOr({}, '_source'), R.head, R.pathOr([], ['hits', 'hits']))(data);
          res.json({
              article: {
                  title: article.headline,
                  published: article.published,
                  url: article.url
              },
              author: {
                  name: article.author,
                  id: 'https://twitter.com/Kevin_Maguire',
                  photo: 'http://i2.mirror.co.uk/incoming/article2876475.ece/ALTERNATES/s98/PROFILE-Kevin-Maguire.png',
                  locations: R.map(R.compose(R.pick(['longitude', 'latitude']), geohash.decode, R.prop('key')), locations)
              },
              organisation: {
                  name: 'The Mirror',
                  privacy: 'http://www.mirror.co.uk/privacy-statement',
                  funding: null,
                  retractions: 'http://www.mirror.co.uk/corrections-clarifications',
                  sourcing: null,
                  mission: 'http://www.trinitymirror.com/our-values',
                  ethics: null
              }
          });
      });

});

app.listen(PORT);

console.log('Magic happens on port:' + PORT);