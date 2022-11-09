const mongoose = require('mongoose')
const Schema = mongoose.Schema
const exerciseUsersSchema = new Schema({
	username: { type: String, unique: true, required: true }
});

module.exports = mongoose.model('ExerciseUsers', exerciseUsersSchema);