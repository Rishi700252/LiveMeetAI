import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import { Box, Paper, Typography, CircularProgress, IconButton, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const server_url = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

export default function MeetingSummary() {
    const { url } = useParams();
    const navigate = useNavigate();
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchSummary = async () => {
        try {
            const response = await fetch(`${server_url}/api/v1/meetings/${url}/summary`);
            if (response.status === 200) {
                const data = await response.json();
                setSummaryData(data);
                setLoading(false);
            } else if (response.status === 404) {
                // Not ready yet
                setLoading(true);
            } else {
                setError("Failed to fetch meeting summary.");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("Error connecting to server.");
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchSummary();

        // Polling every 5 seconds just in case socket fails
        const interval = setInterval(() => {
            if (!summaryData) {
                fetchSummary();
            }
        }, 5000);

        // Listen for socket event from server
        const socket = io(server_url);
        socket.on("summary-ready", (data) => {
            if (data.roomId === url) {
                fetchSummary();
            }
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [url, summaryData]);

    return (
        <div className="landingPageContainer" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <nav>
                <div className="navHeader">
                    <h2>LiveMeetAI</h2>
                </div>
            </nav>

            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', p: { xs: 2, md: 4 }, zIndex: 10 }}>
                <Box
                    component={Paper}
                    elevation={0}
                    sx={{
                        width: '100%',
                        maxWidth: 900,
                        background: 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                        p: { xs: 3, md: 5 },
                        mt: 4
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <IconButton onClick={() => navigate('/history')} sx={{ mr: 2, background: 'rgba(255,255,255,0.5)' }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a" }}>
                            Meeting AI Summary
                        </Typography>
                    </Box>

                    {error ? (
                        <Typography color="error" variant="h6">{error}</Typography>
                    ) : loading || !summaryData ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                            <CircularProgress size={60} sx={{ color: '#db2777', mb: 3 }} />
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#475569' }}>
                                Processing AI Summary...
                            </Typography>
                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                                We are transcribing the audio and analyzing the meeting. This may take a minute.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Executive Summary */}
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b' }}>
                                    Executive Summary
                                </Typography>
                                <Typography sx={{ color: '#334155', fontSize: '1.1rem', lineHeight: 1.7 }}>
                                    {summaryData.summary}
                                </Typography>
                            </Box>

                            <Divider sx={{ borderColor: 'rgba(0,0,0,0.1)' }} />

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {/* Key Decisions */}
                                <Box sx={{ flex: 1, minWidth: '300px' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0369a1' }}>
                                        Key Decisions
                                    </Typography>
                                    {summaryData.decisions && summaryData.decisions.length > 0 ? (
                                        <ul style={{ paddingLeft: '20px', margin: 0, color: '#334155' }}>
                                            {summaryData.decisions.map((decision, i) => (
                                                <li key={i} style={{ marginBottom: '8px', lineHeight: 1.5 }}>{decision}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <Typography color="text.secondary">No decisions were recorded.</Typography>
                                    )}
                                </Box>

                                {/* Action Items */}
                                <Box sx={{ flex: 1, minWidth: '300px' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#b91c1c' }}>
                                        Action Items
                                    </Typography>
                                    {summaryData.actionItems && summaryData.actionItems.length > 0 ? (
                                        <ul style={{ paddingLeft: '20px', margin: 0, color: '#334155' }}>
                                            {summaryData.actionItems.map((action, i) => (
                                                <li key={i} style={{ marginBottom: '8px', lineHeight: 1.5 }}>{action}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <Typography color="text.secondary">No action items were recorded.</Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </div>
    );
}
