import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";

import { io } from "socket.io-client";

import styles from "../styles/videoComponent.module.css";

import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";


const server_url = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

const connections = {};

const peerConfigConnections = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};


export default function VideoMeetComponent() {

    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoRef = useRef();

    const videoRef = useRef([]);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);

    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);

    const [screen, setScreen] = useState(false);

    const [screenAvailable, setScreenAvailable] =
        useState(false);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);

    const [askForUsername, setAskForUsername] =
        useState(true);

    const [username, setUsername] = useState("");
    const [nameError, setNameError] = useState("");

    const [videos, setVideos] = useState([]);

    const [showModal, setModal] = useState(false);

    let routeTo =useNavigate();


    // =====================================================
    // GET PERMISSIONS
    // =====================================================

    const getPermissions = async () => {

        try {

            let videoPermission = false;
            let audioPermission = false;

            try {

                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        video: true
                    });

                if (stream) {

                    videoPermission = true;

                    stream
                        .getTracks()
                        .forEach(track => track.stop());

                }

            } catch (e) {

                console.log("Video permission error:", e);

            }


            try {

                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });

                if (stream) {

                    audioPermission = true;

                    stream
                        .getTracks()
                        .forEach(track => track.stop());

                }

            } catch (e) {

                console.log("Audio permission error:", e);

            }


            setVideoAvailable(videoPermission);
            setAudioAvailable(audioPermission);


            if (navigator.mediaDevices.getDisplayMedia) {

                setScreenAvailable(true);

            } else {

                setScreenAvailable(false);

            }


            // IMPORTANT:
            // Use local variables instead of React state here.

            if (videoPermission || audioPermission) {

                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        video: videoPermission,
                        audio: audioPermission
                    });

                window.localStream = stream;

                if (localVideoRef.current) {

                    localVideoRef.current.srcObject =
                        stream;

                }

            }

        } catch (error) {

            console.log("Permission error:", error);

        }

    };


    useEffect(() => {

        getPermissions();

    }, []);


    // =====================================================
    // CHAT
    // =====================================================

    const addMessage = (
        data,
        sender,
        socketIdSender
    ) => {

        setMessages((messages) => [
            ...messages,
            {
                data: data,
                sender: sender,
                socketIdSender: socketIdSender
            }
        ]);

        setNewMessages(
            newMessages => newMessages + 1
        );

    };

    useEffect(() => {
        if (showModal) {
            setNewMessages(0);
        }
    }, [messages, showModal]);


    const sendMessage = () => {

        if (!message.trim()) {
            return;
        }

        socketRef.current.emit(
            "chat-message",
            message,
            username
        );

        setMessage("");

    };
    const handleEndCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());

            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
        } catch(e) {
            console.log(e);
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        const roomId = window.location.pathname.split("/").pop();
        routeTo(`/${roomId}/summary`);
    }


    // =====================================================
    // GET USER MEDIA SUCCESS
    // =====================================================

    const getUserMediaSuccess = (stream) => {

        try {

            if (window.localStream) {

                window.localStream
                    .getTracks()
                    .forEach(track => track.stop());

            }

        } catch (e) {

            console.log(e);

        }


        window.localStream = stream;

        // Initialize MediaRecorder for AI Summarization
        try {
            if (stream.getAudioTracks().length > 0) {
                const audioStream = new MediaStream([stream.getAudioTracks()[0]]);
                const mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                const currentRoomId = window.location.pathname.split("/").pop();

                mediaRecorder.onstop = async () => {
                    console.log("Audio recording stopped. Uploading for summarization...");
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    
                    const formData = new FormData();
                    formData.append("audio", audioBlob, `meeting-${currentRoomId}.webm`);

                    try {
                        await fetch(`${server_url}/api/v1/meetings/${currentRoomId}/recording`, {
                            method: 'POST',
                            body: formData
                        });
                        console.log("Audio uploaded successfully for AI processing.");
                    } catch (err) {
                        console.error("Failed to upload audio for summarization:", err);
                    }
                };

                mediaRecorder.start(1000); // collect chunks every second
            }
        } catch (err) {
            console.error("Error initializing MediaRecorder:", err);
        }


        if (localVideoRef.current) {

            localVideoRef.current.srcObject =
                stream;

        }


        // Send new stream to existing connections

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            try {
                let videoTrack = stream.getVideoTracks()[0];
                let audioTrack = stream.getAudioTracks()[0];

                if (videoTrack) {
                    let videoSender = connections[id].getSenders().find(s => s.track && s.track.kind === videoTrack.kind);
                    if (videoSender) videoSender.replaceTrack(videoTrack);
                }

                if (audioTrack) {
                    let audioSender = connections[id].getSenders().find(s => s.track && s.track.kind === audioTrack.kind);
                    if (audioSender) audioSender.replaceTrack(audioTrack);
                }
            } catch (e) {
                console.log(e);
            }
        }

    };


    // =====================================================
    // GET USER MEDIA
    // =====================================================

    const getUserMedia = () => {

        if (
            (video && videoAvailable) ||
            (audio && audioAvailable)
        ) {

            navigator.mediaDevices
                .getUserMedia({
                    video:
                        video && videoAvailable,

                    audio:
                        audio && audioAvailable
                })
                .then(getUserMediaSuccess)
                .catch(error =>
                    console.log(
                        "getUserMedia error:",
                        error
                    )
                );

        }

    };


    useEffect(() => {

        if (
            video !== undefined &&
            audio !== undefined
        ) {

            getUserMedia();

        }

    }, [video, audio]);


    // =====================================================
    // SIGNAL
    // =====================================================

    const gotMessageFromServer = (
        fromId,
        message
    ) => {

        try {

            if (!message) {
                return;
            }

            const signal =
                typeof message === "string"
                    ? JSON.parse(message)
                    : message;


            if (fromId === socketIdRef.current) {
                return;
            }


            if (!connections[fromId]) {
                return;
            }


            // ---------------- SDP ----------------

            if (signal.sdp) {

                connections[fromId]
                    .setRemoteDescription(
                        new RTCSessionDescription(
                            signal.sdp
                        )
                    )
                    .then(() => {

                        if (
                            signal.sdp.type === "offer"
                        ) {

                            return connections[fromId]
                                .createAnswer();

                        }

                    })
                    .then(description => {

                        if (!description) {
                            return;
                        }

                        return connections[fromId]
                            .setLocalDescription(
                                description
                            );

                    })
                    .then(() => {

                        if (
                            connections[fromId] &&
                            connections[fromId]
                                .localDescription
                        ) {

                            socketRef.current.emit(
                                "signal",
                                fromId,
                                JSON.stringify({
                                    sdp:
                                        connections[fromId]
                                            .localDescription
                                })
                            );

                        }

                    })
                    .catch(error =>
                        console.log(
                            "SDP error:",
                            error
                        )
                    );

            }


            // ---------------- ICE ----------------

            if (signal.ice) {

                connections[fromId]
                    .addIceCandidate(
                        new RTCIceCandidate(
                            signal.ice
                        )
                    )
                    .catch(error =>
                        console.log(
                            "ICE error:",
                            error
                        )
                    );

            }

        } catch (error) {

            console.log(
                "Signal parsing error:",
                error
            );

        }

    };


    // =====================================================
    // SOCKET CONNECTION
    // =====================================================

    const connectToSocketServer = () => {

        socketRef.current =
            io(server_url);


        socketRef.current.on(
            "signal",
            gotMessageFromServer
        );


        socketRef.current.on(
            "connect",
            () => {

                socketIdRef.current =
                    socketRef.current.id;


                console.log(
                    "Connected:",
                    socketIdRef.current
                );


                socketRef.current.emit(
                    "join-call",
                    window.location.href,
                    username
                );


                socketRef.current.on(
                    "chat-message",
                    addMessage
                );


                // =================================================
                // USER LEFT
                // =================================================

                socketRef.current.on(
                    "user-left",
                    (id) => {

                        setVideos(
                            videos =>
                                videos.filter(
                                    video =>
                                        video.socketId !== id
                                )
                        );


                        videoRef.current =
                            videoRef.current.filter(
                                video =>
                                    video.socketId !== id
                            );


                        if (connections[id]) {

                            connections[id].close();

                            delete connections[id];

                        }

                    }
                );


                // =================================================
                // USER JOINED
                // =================================================

                socketRef.current.on(
                    "user-joined",
                    (id, clients, socketUsernames) => {

                        console.log(
                            "User joined:",
                            id,
                            clients
                        );


                        clients.forEach(
                            socketListId => {

                                if (
                                    socketListId ===
                                    socketIdRef.current
                                ) {

                                    return;

                                }


                                // Create peer connection

                                connections[
                                    socketListId
                                ] =
                                    new RTCPeerConnection(
                                        peerConfigConnections
                                    );


                                // ---------------- ICE ----------------

                                connections[
                                    socketListId
                                ].onicecandidate =
                                    event => {

                                        if (
                                            event.candidate
                                        ) {

                                            socketRef.current.emit(
                                                "signal",
                                                socketListId,
                                                JSON.stringify({
                                                    ice:
                                                        event.candidate
                                                })
                                            );

                                        }

                                    };


                                // ---------------- REMOTE VIDEO ----------------

                                connections[
                                    socketListId
                                ].onaddstream =
                                    event => {

                                        console.log(
                                            "Remote stream:",
                                            socketListId
                                        );


                                        const videoExists =
                                            videoRef.current.find(
                                                video =>
                                                    video.socketId ===
                                                    socketListId
                                            );


                                        if (
                                            videoExists
                                        ) {

                                            setVideos(
                                                videos => {

                                                    const updatedVideos =
                                                        videos.map(
                                                            video =>

                                                                video.socketId ===
                                                                socketListId

                                                                    ? {
                                                                        ...video,
                                                                        stream:
                                                                            event.stream
                                                                    }

                                                                    : video
                                                        );


                                                    videoRef.current =
                                                        updatedVideos;


                                                    return updatedVideos;

                                                }
                                            );

                                        } else {

                                            const newVideo = {

                                                socketId:
                                                    socketListId,

                                                username:
                                                    socketUsernames ? socketUsernames[socketListId] : "Guest",

                                                stream:
                                                    event.stream,

                                                autoPlay:
                                                    true,

                                                playsInline:
                                                    true

                                            };


                                            setVideos(
                                                videos => {

                                                    const updatedVideos =
                                                        [
                                                            ...videos,
                                                            newVideo
                                                        ];


                                                    videoRef.current =
                                                        updatedVideos;


                                                    return updatedVideos;

                                                }
                                            );

                                        }

                                    };


                                // ---------------- LOCAL STREAM ----------------

                                if (
                                    window.localStream
                                ) {

                                    connections[
                                        socketListId
                                    ].addStream(
                                        window.localStream
                                    );

                                }

                            }
                        );


                        // =================================================
                        // CREATE OFFER
                        // =================================================

                        if (
                            id === socketIdRef.current
                        ) {

                            for (
                                let id2 in connections
                            ) {

                                if (
                                    id2 ===
                                    socketIdRef.current
                                ) {

                                    continue;

                                }


                                connections[id2]
                                    .createOffer()
                                    .then(
                                        description => {

                                            return connections[id2]
                                                .setLocalDescription(
                                                    description
                                                );

                                        }
                                    )
                                    .then(() => {

                                        socketRef.current.emit(
                                            "signal",
                                            id2,
                                            JSON.stringify({
                                                sdp:
                                                    connections[id2]
                                                        .localDescription
                                            })
                                        );

                                    })
                                    .catch(error =>
                                        console.log(
                                            "Offer error:",
                                            error
                                        )
                                    );

                            }

                        }

                    }
                );

            }
        );

    };


    // =====================================================
    // CONNECT BUTTON
    // =====================================================

    const getMedia = () => {

        if (username.includes("http://") || username.includes("https://")) {
            setNameError("Please enter a valid name, not a URL.");
            return;
        }
        if (username.length > 40) {
            setNameError("Name is too long (max 40 characters).");
            return;
        }
        setNameError("");

        setVideo(videoAvailable);

        setAudio(audioAvailable);

        connectToSocketServer();

        setAskForUsername(false);

    };


    // =====================================================
    // VIDEO BUTTON
    // =====================================================

    const handleVideo = () => {

        setVideo(
            previous => !previous
        );

    };


    // =====================================================
    // AUDIO BUTTON
    // =====================================================

    const handleAudio = () => {

        setAudio(
            previous => !previous
        );

    };


    // =====================================================
    // SCREEN SHARE
    // =====================================================

    const getDisplayMediaSuccess = (
        stream
    ) => {

        try {

            if (window.localStream) {

                window.localStream
                    .getTracks()
                    .forEach(track =>
                        track.stop()
                    );

            }

        } catch (e) {

            console.log(e);

        }


        window.localStream = stream;


        if (localVideoRef.current) {

            localVideoRef.current.srcObject =
                stream;

        }


        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            try {
                let videoTrack = stream.getVideoTracks()[0];
                let sender = connections[id].getSenders().find(s => s.track && s.track.kind === videoTrack.kind);
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            } catch (e) {
                console.log(e);
            }
        }


        stream
            .getVideoTracks()[0]
            .onended = () => {

                setScreen(false);

                getUserMedia();

            };

    };


    const getDisplayMedia = () => {

        if (!screen) {
            return;
        }


        if (
            navigator.mediaDevices
                .getDisplayMedia
        ) {

            navigator.mediaDevices
                .getDisplayMedia({
                    video: true,
                    audio: true
                })
                .then(
                    getDisplayMediaSuccess
                )
                .catch(error =>
                    console.log(
                        "Screen share error:",
                        error
                    )
                );

        }

    };


    useEffect(() => {

        if (screen) {

            getDisplayMedia();

        } else {
            getUserMedia();
        }

    }, [screen]);


    const handleScreen = () => {

        setScreen(
            previous => !previous
        );

    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <div>

            {askForUsername ? (
                <div className="landingPageContainer" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: 600,
                        background: 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                        padding: '3rem',
                        zIndex: 10
                    }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            marginBottom: '1rem',
                            color: '#0f172a',
                            textAlign: 'center'
                        }}>
                            Ready to <span style={{
                                background: 'linear-gradient(to right, #FF9839, #ec4899)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>Join?</span>
                        </h2>

                        <div style={{ width: '100%', marginBottom: '2rem' }}>
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                muted 
                                style={{
                                    width: '100%',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                    objectFit: 'cover',
                                    backgroundColor: '#111',
                                    aspectRatio: '16/9'
                                }}
                            ></video>
                        </div>

                        <TextField
                            label="Your Name"
                            value={username}
                            variant="outlined"
                            fullWidth
                            onChange={e => {
                                setUsername(e.target.value);
                                setNameError("");
                            }}
                            error={!!nameError}
                            helperText={nameError}
                            sx={{
                                marginBottom: '1.5rem',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                }
                            }}
                        />

                        <div role='button' onClick={getMedia} style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }}>
                            <a style={{
                                display: 'block',
                                width: '100%',
                                background: 'linear-gradient(45deg, #FF9839, #ec4899)',
                                backgroundSize: '200% auto',
                                color: 'white',
                                textDecoration: 'none',
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                padding: '1rem',
                                borderRadius: '50px',
                                boxShadow: '0 10px 25px rgba(255, 152, 57, 0.4)',
                                transition: 'all 0.3s ease',
                                animation: 'pulseGlow 2s infinite, shineBtn 3s linear infinite',
                            }}>
                                Join Meeting
                            </a>
                        </div>

                    </div>

                </div>

            ) : (

                <div
                    className={
                        styles.meetVideoContainer
                    }
                >

                    {/* ================= CHAT ================= */}

                    {showModal && (

                        <div
                            className={
                                styles.chatRoom
                            }
                        >

                            <div
                                className={
                                    styles.chatContainer
                                }
                            >

                                <h1>
                                    Chat
                                </h1>


                                <div
                                    className={
                                        styles.chattingDisplay
                                    }
                                >

                                    {messages.map(
                                        (item, index) => (

                                            <div 
                                                key={index}
                                            >

                                                <b>
                                                    {item.sender}
                                                </b>

                                                :{" "}

                                                {item.data}

                                            </div>

                                        )
                                    )}

                                </div>


                                <div
                                    className={
                                        styles.chattingArea
                                    }
                                >

                                    <TextField
                                        value={message}
                                        onChange={e =>
                                            setMessage(
                                                e.target.value
                                            )
                                        }
                                        label="Enter your chat"
                                        variant="outlined"
                                    />


                                    <Button
                                        variant="contained"
                                        onClick={
                                            sendMessage
                                        }
                                    >
                                        Send
                                    </Button>

                                </div>

                            </div>

                        </div>

                    )}


                    {/* ================= BUTTONS ================= */}

                    <div
                        className={
                            styles.buttonContainers
                        }
                    >

                        <IconButton
                            onClick={handleVideo}
                            style={{
                                color: "white"
                            }}
                        >

                            {video
                                ? <VideocamIcon />
                                : <VideocamOffIcon />
                            }

                        </IconButton>


                        <IconButton onClick={handleEndCall}
                            style={{
                                color: "red"
                            }}
                        >

                            <CallEndIcon  />

                        </IconButton>


                        <IconButton
                            onClick={handleAudio}
                            style={{
                                color: "white"
                            }}
                        >

                            {audio
                                ? <MicIcon />
                                : <MicOffIcon />
                            }

                        </IconButton>


                        {screenAvailable && (

                            <IconButton
                                onClick={handleScreen}
                                style={{
                                    color: "white"
                                }}
                            >

                                {screen
                                    ? <StopScreenShareIcon />
                                    : <ScreenShareIcon />
                                }

                            </IconButton>

                        )}


                        <Badge
                            badgeContent={
                                newMessages
                            }
                            max={999}
                            color="secondary"
                        >

                            <IconButton
                                onClick={() =>
                                    setModal(
                                        previous =>
                                            !previous
                                    )
                                }
                                style={{
                                    color: "white"
                                }}
                            >

                                <ChatIcon />

                            </IconButton>

                        </Badge>

                    </div>


                    {/* ================= LOCAL VIDEO ================= */}

                    <video
                        className={
                            styles.meetUserVideo
                        }
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                    />


                    {/* ================= REMOTE VIDEOS ================= */}

                    <div
                        className={
                            styles.conferenceView
                        }
                    >

                        {videos.map(video => (

                            <div
                                key={video.socketId}
                            >

                                <h2>
                                    {video.username || video.socketId}
                                </h2>


                                <video
                                    data-socket={
                                        video.socketId
                                    }
                                    ref={ref => {

                                        if (
                                            ref &&
                                            video.stream
                                        ) {

                                            ref.srcObject =
                                                video.stream;

                                        }

                                    }}
                                    autoPlay
                                    playsInline
                                />

                            </div>

                        ))}

                    </div>

                </div>

            )}

        </div>

    );

}