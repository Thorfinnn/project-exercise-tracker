const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

app.use(cors())
app.use(express.static('public'))
app.set('json spaces',2)

mongoose.connect(process.env.MONGO_URI,{
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const urlencoder = bodyParser.urlencoded({extended: true});
app.use(urlencoder);
app.use(bodyParser.json());
let userSchema = new mongoose.Schema({
  username:{type:String,required:true}
});
let User = new mongoose.model('User',userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users').post((req,res)=>{
  console.log(req.body);
  let username = req.body.username;
  User.exists({username:username.toString()},(error,result)=>{
    if(error) return console.log(error);
    else if(!result){
      let user = new User({
        username: username.toString()
      });
      user.save((err,data)=>{
        if(err) return console.log(err);
        return res.json(data);
      })
    }else{
      User.find({username: username.toString()},(err,data)=>{
        if(err) return console.log(err);
        return res.json({
          username: data[0].username,
          _id: data[0]._id
        });
      });
    }
  });
}).get((req,res)=>{
  User.find((err,data)=>{
    if(err) console.log(err);
    return res.json(data);
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
