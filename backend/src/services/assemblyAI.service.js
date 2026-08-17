import fs from 'fs';

const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2';

export const transcribeAudio = async (filePath) => {
    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) throw new Error("Missing AssemblyAI API Key");

        console.log(`[AssemblyAI] Uploading audio file: ${filePath}`);
        
        // 1. Read file as buffer
        const audioData = fs.readFileSync(filePath);

        // 2. Upload to AssemblyAI
        const uploadResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/octet-stream',
            },
            body: audioData
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        const audioUrl = uploadResult.upload_url;
        console.log(`[AssemblyAI] File uploaded successfully. URL: ${audioUrl}`);

        // 3. Submit for transcription
        const transcriptResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({ audio_url: audioUrl })
        });

        if (!transcriptResponse.ok) {
            throw new Error(`Transcription request failed with status ${transcriptResponse.status}`);
        }

        const transcriptResult = await transcriptResponse.json();
        const transcriptId = transcriptResult.id;
        console.log(`[AssemblyAI] Transcription started. ID: ${transcriptId}`);

        // 4. Poll for completion
        let isCompleted = false;
        let transcriptText = "";

        while (!isCompleted) {
            console.log(`[AssemblyAI] Polling transcription status for ID: ${transcriptId}...`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3 seconds

            const pollingResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`, {
                method: 'GET',
                headers: {
                    'authorization': apiKey
                }
            });

            if (!pollingResponse.ok) {
                throw new Error(`Polling failed with status ${pollingResponse.status}`);
            }

            const pollingResult = await pollingResponse.json();
            
            if (pollingResult.status === 'completed') {
                isCompleted = true;
                transcriptText = pollingResult.text;
                console.log(`[AssemblyAI] Transcription completed successfully.`);
            } else if (pollingResult.status === 'error') {
                isCompleted = true;
                throw new Error(`Transcription failed: ${pollingResult.error}`);
            }
        }

        return transcriptText;

    } catch (error) {
        console.error(`[AssemblyAI] Service Error:`, error);
        throw error;
    }
};
