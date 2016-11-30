'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const hl = require('highland');
const R = require('ramda');
const sha1 = require('sha1');
const cheerio = require('cheerio');
const tz = require('timezone/loaded');
const path = require('path');
const request = require('superagent');
const geohash = require('ngeohash');
const authorsDB = require('./data/authors');
const organisationsDB = require('./data/organisations');

// Constants
const PORT = process.env.PORT || 2327;
const JUICER_API_KEY = 'iCNGx8l4R3Pf2ge9itNAvz3MXOVK9lyG';
const JUICER_URL = 'http://juicer.api.bbci.co.uk/articles';
const HIVE_URL = 'https://hivealpha.com/api/author-info';

const app = express();

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/api/validate', (req, res) => {
    hl(request.get(`${JUICER_URL}/${sha1(req.body.url)}`).query({api_key: JUICER_API_KEY}).then(R.prop('body')))
        .map(article => {
            if(article.id === null) return {fake: true};
            const {title, published, url, authors} = article;
            const author = authorsDB[R.head(authors)];
            return {
                article: {
                    title,
                    published: tz(published, '%-d-%-m-%Y'),
                    url
                },
                author: {
                    name: R.head(authors),
                    id: author.twitter,
                    photo: author.photo
                }
            }
        })
        .flatMap(article => {
            if(article.fake) return hl.of(article);
            return hl(request.get(HIVE_URL).query({auth: 'trust'}).query({author: article.author.name})
                .then(R.prop('body')))
                .map(data => {
                    const locations = R.pathOr([], ['aggregations', 'geohash_1', 'geohash_2', 'geohash_3', 'buckets'], data);
                    return R.assocPath(['author', 'locations'], R.map(R.compose(R.pick(['longitude', 'latitude']), geohash.decode, R.prop('key')), locations), article);
                });
        })
        .map(article => {
            return R.assoc(['organisation'], {organisation: organisationsDB['mirror']}, article);
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