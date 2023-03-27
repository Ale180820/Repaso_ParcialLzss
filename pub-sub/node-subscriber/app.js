//
// Copyright 2021 The Dapr Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

const express = require('express');
const bodyParser = require('body-parser');
const lzbase62 = require('lzbase62');
const axios  = require('axios');
var admin = require("firebase-admin");

const app = express();
// Dapr publishes messages with the application/cloudevents+json content-type
app.use(bodyParser.json({ type: 'application/*+json' }));

const port = 3000;
const daprPort = process.env.DAPR_HTTP_PORT ?? 3500;
const daprUrl = `http://localhost:${daprPort}/v1.0`;
const pubsubName = 'pubsub';

var serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://compressapp-6e029-default-rtdb.firebaseio.com"
});

const db = admin.database();
var ref = db.ref("/textCompression");

app.get('/dapr/subscribe', (_req, res) => {
    res.json([
        {
            pubsubname: "pubsub",
            topic: "A",
            route: "A"
        },
        {
            pubsubname: "pubsub",
            topic: "B",
            route: "B"
        },
        {
            pubsubname: "pubsub",
            topic: "CompressText",
            route: "CompressText"
        }
    ]);
});

app.post('/CompressText', async (req, res) => {
    const compressed = lzbase62.compress(req.body.data.message);
    console.log("Texto Original: ", req.body.data.message);
    console.log("Texto Comprimido: ", compressed);
    var newPost = {
        messageType: "resultado",
        message: compressed
    }
    axios.post(`${daprUrl}/publish/${pubsubName}/resultado`, newPost);
    ref.push(newPost);
    res.sendStatus(200);
});

app.post('/B', (req, res) => {
    console.log("B: ", req.body.data.message);
    res.sendStatus(200);
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
