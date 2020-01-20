import mongoose from 'mongoose'

const { Schema } = mongoose

const EvaluationSchema = new Schema({
  rating: {
    type: Number,
  },
  comment: {
    type: String,
  },
})

export default mongoose.model('Evaluation', EvaluationSchema)

/**
 * @typedef {Object} EvaluationMongooseDocument
 * @property {number} rating
 * @property {string} comment
 */