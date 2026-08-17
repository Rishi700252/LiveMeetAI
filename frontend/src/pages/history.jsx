import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';

import { IconButton } from '@mui/material';
import withAuth from '../utils/withAuth';

function History() {


    const { getHistoryOfUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([])


    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }

        fetchHistory();
    }, [])

    let formatDate = (dateString) => {

        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();

        return `${day}/${month}/${year}`

    }

    return (
        <div className="landingPageContainer" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <nav>
                <div className="navHeader">
                    <h2>LiveMeetAI</h2>
                </div>
                <div className="navlist">
                    <div onClick={() => routeTo("/home")} style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px" }}>
                        <HomeIcon />
                        <p style={{ margin: 0 }}>Home</p>
                    </div>
                </div>
            </nav>

            <div style={{ padding: "4rem", flex: 1, zIndex: 10, position: 'relative' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: "#0f172a" }}>
                    Meeting History
                </Typography>

                {meetings.length !== 0 ? (
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: 3 
                    }}>
                        {meetings.map((e, i) => (
                            <Card key={i} variant="outlined" sx={{
                                background: 'rgba(255, 255, 255, 0.4)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
                                }
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }} color="text.secondary" gutterBottom>
                                        Meeting Code
                                    </Typography>
                                    <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: "#0f172a", mb: 2 }}>
                                        {e.meetingCode}
                                    </Typography>
                                    <Typography sx={{ fontSize: 14 }} color="text.secondary">
                                        Date: <strong>{formatDate(e.date)}</strong>
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                ) : (
                    <Typography variant="h6" color="text.secondary">
                        No meeting history found.
                    </Typography>
                )}
            </div>
        </div>
    )
}
export default withAuth(History);