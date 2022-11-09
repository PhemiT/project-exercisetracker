const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');

// import "mongoose" - required for DB Access
const mongoose = require('mongoose');
// URI
const DB = require('./config/db');
// require models
const Exercises = require('./models/exercise');
const ExerciseUsers = require('./models/exerciseUsers');

mongoose.connect(process.env.URI || DB.URI, {useNewUrlParser: true, useUnifiedTopology: true});

let mongoDB = mongoose.connection;
mongoDB.on('error', console.error.bind(console, 'Connection Error:'));
mongoDB.once('open', ()=> {
  console.log("Connected to MongoDB...");
});

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
  extended: false
}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', function (req, res) {
	if (req.body.username === '') {
		return res.json({ error: 'username is required' });
	}

	let username = req.body.username;
	let _id = '';

	ExerciseUsers.findOne({ username: username }, function (err, data) {
		if (!err && data === null) {
			let newUser = new ExerciseUsers({
				username: req.body.username
			});

			newUser.save(function (err, data) {
				if (!err) {
					_id = data['_id'];

					return res.json({
						_id: _id,
						username: username
					});
				}
			});
		} else {
			return res.json({ error: 'username already exists' });
		}
	});
});

app.get('/api/users', function (req, res) {
	ExerciseUsers.find({}, function (err, data) {
		if (!err) {
			return res.json(data);
		}
	});
});

app.post('/api/users/:_id/exercises', function (req, res) {
	if (req.params._id === '0') {
		return res.json({ error: '_id is required' });
	}

	if (req.body.description === '') {
		return res.json({ error: 'description is required' });
	}

	if (req.body.duration === '') {
		return res.json({ error: 'duration is required' });
	}

	let userId = req.params._id;
	let description = req.body.description;
	let duration = parseInt(req.body.duration);
	let date = (req.body.date !== undefined ? new Date(req.body.date) : new Date());

	if (isNaN(duration)) {
		return res.json({ error: 'duration is not a number' });
	}

	if (date == 'Invalid Date') {
		return res.json({ error: 'date is invalid' });
	}

	ExerciseUsers.findById(userId, function (err, data) {
		if (!err && data !== null) {
			let newExercise = new Exercises({
				userId: userId,
				description: description,
				duration: duration,
				date: date
			});

			newExercise.save(function (err2, data2) {
				if (!err2) {
					return res.json({
						_id: data['_id'],
						username: data['username'],
						description: data2['description'],
						duration: data2['duration'],
						date: new Date(data2['date']).toDateString()
					});
				}
			});
		} else {
			return res.json({ error: 'user not found' });
		}
	});
});

app.get('/api/users/:_id/exercises', function (req, res) {
	res.redirect('/api/users/' + req.params._id + '/logs');
});

app.get('/api/users/:_id/logs', function (req, res) {
	let userId = req.params._id;
	let findConditions = { userId: userId };

	if (
		(req.query.from !== undefined && req.query.from !== '')
		||
		(req.query.to !== undefined && req.query.to !== '')
	) {
		findConditions.date = {};

		if (req.query.from !== undefined && req.query.from !== '') {
			findConditions.date.$gte = new Date(req.query.from);
		}

		if (findConditions.date.$gte == 'Invalid Date') {
			return res.json({ error: 'from date is invalid' });
		}

		if (req.query.to !== undefined && req.query.to !== '') {
			findConditions.date.$lte = new Date(req.query.to);
		}

		if (findConditions.date.$lte == 'Invalid Date') {
			return res.json({ error: 'to date is invalid' });
		}
	}

	let limit = (req.query.limit !== undefined ? parseInt(req.query.limit) : 0);

	if (isNaN(limit)) {
		return res.json({ error: 'limit is not a number' });
	}

	ExerciseUsers.findById(userId, function (err, data) {
		if (!err && data !== null) {
			Exercises.find(findConditions).sort({ date: 'asc' }).limit(limit).exec(function (err2, data2) {
				if (!err2) {
					return res.json({
						_id: data['_id'],
						username: data['username'],
						log: data2.map(function (e) {
							return {
								description: e.description,
								duration: e.duration,
								date: new Date(e.date).toDateString()
							};
						}),
						count: data2.length
					});
				}
			});
		} else {
			return res.json({ error: 'user not found' });
		}
	});
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
