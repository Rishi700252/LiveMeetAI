import mongoose from "mongoose";

const meetingSummarySchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    transcript: {
        type: String,
        default: ""
    },
    summary: {
        type: String,
        default: ""
    },
    decisions: {
        type: [String],
        default: []
    },
    actionItems: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const MeetingSummary = mongoose.model("MeetingSummary", meetingSummarySchema);
export default MeetingSummary;
