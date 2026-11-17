import mongoose from "mongoose";

const pixelSchema = new mongoose.Schema({
    pixelId: {
        type: String,
        trim: true,
        default: ""
    },
    isEnabled: {
        type: Boolean,
        default: false
    },
    capiToken: {
        type: String,
        trim: true,
        default: ""
    },
    testEventCode: {
        type: String,
        trim: true,
        default: ""
    }
}, {
    timestamps: true
});

const PixelModel = mongoose.model('pixel', pixelSchema);

export default PixelModel;
