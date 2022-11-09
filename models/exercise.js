const mongoose = require('mongoose')
const Schema = mongoose.Schema
const exercisesSchema = new Schema({
	userId: { type: String, required: true },
	description: { type: String, required: true },
	duration: { type: Number, min: 1, required: true },
	date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exercises', exercisesSchema);