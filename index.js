const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

app.use(cors())
app.use(express.static('public'))
app.set('json spaces', 2)

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const urlencoder = bodyParser.urlencoded({ extended: true });
app.use(urlencoder);
app.use(bodyParser.json());
let userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});
let User = new mongoose.model('User', userSchema);

let exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  userid: String
});
let Exercise = new mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users').post((req, res) => {
  let username = req.body.username;
  User.exists({ username: username.toString() }, (error, result) => {
    if (error) return console.log(error);
    else if (!result) {
      let user = new User({
        username: username.toString()
      });
      user.save((err, data) => {
        if (err) return console.log(err);
        return res.json({
          username: data.username,
          _id: data._id
        });
      })
    } else {
      User.find({ username: username.toString() }, (err, data) => {
        if (err) return console.log(err);
        return res.json({
          username: data[0].username,
          _id: data[0]._id
        });
      });
    }
  });
}).get((req, res) => {
  User.find((err, data) => {
    if (err) console.log(err);
    data.map((item) => {
      return {
        username: item.username,
        _id: item._id
      }
    });
    return res.json(data);
  });
});

app.post('/api/users/:id/exercises', (req, res, next) => {
  req.body.id = req.params.id;
  if (typeof req.body.date === `undefined`) {
    req.body.date = new Date().toDateString();
  } else {
    let date = new Date(req.body.date)
    req.body.date = date.toDateString();
  }
  next();
}, (req, res) => {
  User.findById(req.body.id.toString(), (err, dat) => {
    if (err) return console.log(err);
    let exercise = new Exercise({
      username: dat.username,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: req.body.date,
      userid: req.body.id
    });
    exercise.save((err, data) => {
      if (err) return console.log(err);
      let resjson = {
        _id: req.body.id,
        username: data.username,
        date: data.date,
        duration: parseInt(data.duration),
        description: data.description
      }
      console.log(resjson);
      return res.json(resjson);
    });
  });
});

app.get('/api/users/:id/logs', (req, res) => {
  console.log(req.params);
  console.log(req.query);
  let id = req.params.id;
  Exercise.find({ userid: id.toString() }, (err, data) => {
    if (err) return console.log(err);
    let log = [];
    for (var i = 0; i < data.length; i++) {
      log.push({
        description: data[i].description,
        duration: parseInt(data[i].duration),
        date: new Date(data[i].date).valueOf()
      });
    }
    if (typeof req.query.from !== `undefined`) {
      from = new Date(req.query.from).valueOf();
      log.filter((item) => {
        return item.date >= from;
      });
    }
    if (typeof req.query.to !== `undefined`) {
      to = new Date(req.query.to).valueOf();
      log.filter((item) => {
        return item.date <= to;
      });
    }
    count = log.length;
    if (typeof req.query.limit !== `undefined`) {
      limit = parseInt(req.query.limit);
      log = log.sort((a,b)=>{
        return b.date - a.date
      });
      log = log.slice(0, limit);
    }
    log = log.map((item) => {
      date = new Date(item.date).toDateString();
      return {
        description: item.description,
        duration: parseInt(item.duration),
        date: date
      };
    });
    resjson = {
      _id: id,
      username: data[0].username,
      count: count,
      log: log
    }
    console.log(resjson);
    return res.json(resjson);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
