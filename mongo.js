const { createConnection, Schema } = require('mongoose')

require('dotenv').config()

const db = createConnection(process.env.MONGO_URI)

const orderItemSchema = new Schema({
  _id: false,
  productId: String,
  title: String,
  image: String,
  price: Number,
  quantity: Number,
  category: String,
  deliveryType: {
    type: String,
    enum: ['account', 'manual'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'claimed'],
    default: 'pending'
  },
  inventoryItemId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
})

const ordersSchema = new Schema({
  email: String,
  id: String,
  items: [orderItemSchema],
  totalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  game: String,
  reciever: {
    username: { type: String, default: '' },
    displayName: { type: String, default: '' },
    id: { type: String, default: '' },
    thumbnail: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  orders: db.model("orders", ordersSchema)
}