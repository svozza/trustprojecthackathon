'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const hl = require('highland');
const R = require('ramda');
const cheerio = require('cheerio');
const tz = require('timezone/loaded');
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
    console.log(req.body.url);
    hl(request.get(req.body.url).then(x => {
        console.log(x)
        return R.prop('text')(x)
    }))
        .map(html => {
            const $ = cheerio.load(html);
            const authorLink = $('[rel="author"]');
            return authorLink.text();
        })
        .flatMap(author => {
            return hl(request.get(HIVE_URL).query({auth: 'trust'}).query({author: author})
                    .then(R.prop('body')));
        })
        .map(data => {
            const locations = R.pathOr([], ['aggregations', 'geohash_1', 'geohash_2', 'geohash_3', 'buckets'], data);
            const article = R.compose(R.propOr({}, '_source'), R.head, R.pathOr([], ['hits', 'hits']))(data);
            return {
                article: {
                    title: article.headline,
                    published: tz(article.published, '%-d-%-m-%Y'),
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
            }
        })
        .toCallback((err, data) => {
            if(err != null) {
                if(err.status != null) res.send(err.status, err.message);
                else res.send(500, err)
            }
            else {
                res.json(data);
            }
        });
});

app.listen(PORT);

console.log('Magic happens on port:' + PORT);