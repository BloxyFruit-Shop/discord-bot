import { Schema, Document, Types } from 'mongoose';

interface IOrderItem extends Document {
    productId: string;
    title: string;
    image: string;
    price: number;
    quantity: number;
    category: string;
    deliveryType: 'account' | 'manual';
    status: 'pending' | 'claimed';
    inventoryItemId?: Types.ObjectId;
}

interface IReceiver {
    username?: string;
    displayName?: string;
    id?: string;
    thumbnail?: string;
}

interface IOrder extends Document {
    email?: string;
    id: string;
    items: IOrderItem[];
    totalAmount: number;
    status: 'pending' | 'completed' | 'cancelled';
    game: string;
    reciever: IReceiver;
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
    _id: false,
    productId: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    category: { type: String },
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
});

const orderSchema = new Schema<IOrder>({
    email: String,
    id: { type: String, required: true, unique: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    game: { type: String, required: true },
    reciever: {
        username: { type: String, default: '' },
        displayName: { type: String, default: '' },
        id: { type: String, default: '' },
        thumbnail: { type: String, default: '' }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export { orderSchema, IOrder, IOrderItem, IReceiver };
