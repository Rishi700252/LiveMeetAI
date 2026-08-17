import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {


    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");


    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <div className="landingPageContainer">

            <nav>

                <div className="navHeader">

                    <h2>LiveMeetAI</h2>
                </div>

                <div className="navlist">
                    <div onClick={() => navigate("/history")} style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px" }}>
                        <RestoreIcon />
                        <p style={{ margin: 0 }}>History</p>
                    </div>

                    <div role='button' onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }}>
                        <p style={{ margin: 0 }}>Logout</p>
                    </div>
                </div>

            </nav>


            <div className="landingMainContainer">
                <div>
                    <h1>Your <span>Meetings</span>, Elevated.</h1>
                    <p style={{ fontSize: "1.2rem", color: "#475569", marginBottom: "2rem" }}>Join a room or start a new conversation instantly.</p>

                    <div style={{ display: 'flex', gap: "15px", alignItems: 'center', marginTop: "30px" }}>

                        <TextField
                            onChange={e => setMeetingCode(e.target.value)}
                            id="outlined-basic"
                            label="Enter Meeting Code"
                            variant="outlined"
                            sx={{
                                backgroundColor: "rgba(255, 255, 255, 0.7)",
                                borderRadius: "10px",
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: "10px",
                                }
                            }}
                        />
                        <div role='button' onClick={handleJoinVideoCall} style={{ cursor: "pointer" }}>
                            <a>Join Meeting</a>
                        </div>

                    </div>
                </div>
                <div>
                    <img src='/logo3.png' alt="" />
                </div>
            </div>
        </div>
    )
}


export default withAuth(HomeComponent)