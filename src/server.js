import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import ResponseStore from './stores/ResponseStore';
import RequestStore from './stores/RequestStore';

const app = express();
const responseStore = new ResponseStore();
const requestStore = new RequestStore();

app.use(cors({
  origin: 'http://localhost:3030',
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));


app.use(bodyParser.json());
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.status(200).sendFile(`${__dirname}/../public/index.html`);
});

app.get('/simulado/requests', (req, res) => {
  const allRequests = requestStore.getState();
  res.status(200).send(allRequests);
});

app.post('/simulado/response/set', (req, res) => {
  const responseToMock = req.body;
  responseStore.add(responseToMock);
  res.sendStatus(201);
});

app.delete('/simulado/responses/clear', (req, res) => {
  responseStore.removeAll();
  res.sendStatus(201);
});

app.delete('/simulado/requests/clear', (req, res) => {
  requestStore.removeAll();
  res.sendStatus(201);
});

app.all('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', req.get('origin'));
  const matchedResponse = responseStore.match(req.method, req.path, req.headers, req.body);

  if (matchedResponse) {
    const { path, method, headers, body } = req;
    requestStore.add({ path, method, headers, body });
    return res.status(matchedResponse.status).send(matchedResponse.body);
  }

  res.sendStatus(404);
});

const DEFAULT_PORT_NUMBER = 9999;

let server

export const start = (portNumber) => {
  server = app.listen(portNumber || DEFAULT_PORT_NUMBER, () => {
    console.log(`SIMULADO STARTED ON PORT: ${portNumber || DEFAULT_PORT_NUMBER}`);
  });

  return server
}

export const stop = () => {
  server.close()
}
