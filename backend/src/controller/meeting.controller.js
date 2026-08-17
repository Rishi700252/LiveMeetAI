import MeetingSummary from "../models/meetingSummary.model.js";
import { transcribeAudio } from "../services/assemblyAI.service.js";
import { summarizeTranscript } from "../services/gemini.service.js";
import { getIo, getConnections } from "./socketManager.js";
import fs from "fs";
import path from "path";

export const uploadAudio = async (req, res) => {
    try {
        const { roomId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ message: "No audio file uploaded" });
        }

        const filePath = req.file.path;
        console.log(`[Upload] Audio received for room ${roomId} at ${filePath}`);
        
        // Respond to the client immediately so they don't block waiting for AI
        res.status(202).json({ message: "Audio uploaded successfully. Processing started." });

        // Kick off the AI pipeline asynchronously
        processMeetingAudio(roomId, filePath).catch(err => {
            console.error(`[Pipeline Error] Failed to process meeting audio for room ${roomId}:`, err);
        });

    } catch (error) {
        console.error("Error in uploadAudio:", error);
        res.status(500).json({ message: "Internal server error during upload" });
    }
};

const processMeetingAudio = async (roomId, filePath) => {
    try {
        console.log(`[Pipeline] Starting transcription for room: ${roomId}`);
        const transcriptText = await transcribeAudio(filePath);
        
        let summaryData = {
            summary: "",
            decisions: [],
            actionItems: []
        };

        if (!transcriptText || transcriptText.trim().length === 0) {
            console.warn(`[Pipeline] Transcript is empty for room: ${roomId}. Skipping Gemini.`);
            summaryData.summary = "No speech was detected in this meeting. The audio transcript was empty, so an AI summary could not be generated.";
        } else {
            console.log(`[Pipeline] Starting summarization for room: ${roomId}`);
            summaryData = await summarizeTranscript(transcriptText);
        }

        const meetingSummary = new MeetingSummary({
            roomId: roomId,
            transcript: transcriptText || "No transcript available.",
            summary: summaryData.summary,
            decisions: summaryData.decisions,
            actionItems: summaryData.actionItems
        });

        await meetingSummary.save();
        console.log(`[Pipeline] Summary saved to MongoDB for room: ${roomId}`);

        // Clean up the local audio file to save space
        try {
            fs.unlinkSync(filePath);
            console.log(`[Pipeline] Cleaned up temporary audio file: ${filePath}`);
        } catch (unlinkErr) {
            console.error(`[Pipeline] Failed to delete file ${filePath}:`, unlinkErr);
        }

        // Broadcast to clients in this room that the summary is ready
        const io = getIo();
        const connections = getConnections();
        if (io && connections[roomId]) {
            console.log(`[Pipeline] Emitting summary-ready to room: ${roomId}`);
            connections[roomId].forEach(socketId => {
                io.to(socketId).emit("summary-ready", { roomId });
            });
        }

    } catch (error) {
        console.error(`[Pipeline Error] Error processing meeting audio for room ${roomId}:`, error);
        throw error;
    }
};

export const getSummary = async (req, res) => {
    try {
        const { roomId } = req.params;
        const summary = await MeetingSummary.findOne({ roomId: roomId }).sort({ createdAt: -1 });

        if (!summary) {
            return res.status(404).json({ message: "Summary not found for this room yet." });
        }

        return res.status(200).json(summary);
    } catch (error) {
        console.error("Error in getSummary:", error);
        res.status(500).json({ message: "Internal server error fetching summary" });
    }
};
