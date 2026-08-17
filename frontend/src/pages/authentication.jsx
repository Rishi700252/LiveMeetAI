import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Snackbar from '@mui/material/Snackbar';
import { AuthContext } from "../contexts/AuthContext";



// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function Authentication() {

    const [username,setUsername] =React.useState();
    const [password,setPassword] =React.useState();
    const[name,setName] =React.useState();
    const [error,setError] =React.useState();
    const[message,setMessage] =React.useState();

    const [formState,setFormState] =React.useState(0);
    const [open,setOpen] =React.useState(false);
    const {handleRegister,handleLogin} =React.useContext(AuthContext);

    let handleAuth =async () =>{
        try{
            if(formState === 0){
                let result =await handleLogin(username,password)
                

            }
            if(formState ===1){
                let result =await handleRegister(name,username,password);
                console.log(result);
                setUsername("");
                setMessage(result);
                setOpen(true);
                setError("");
                setFormState(0);
                setPassword("")

            }
        }catch(err){
            let message =(err.response.data.message);
            setError(message);

        }
    }




  return (
    <ThemeProvider theme={defaultTheme}>
        <div className="landingPageContainer" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            <CssBaseline />

            <Box
                component={Paper}
                elevation={0}
                square={false}
                sx={{
                    my: 8,
                    mx: 4,
                    p: { xs: 3, sm: 5 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: 450,
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                    zIndex: 10
                }}
            >
                <Typography component="h1" variant="h3" sx={{
                    fontWeight: 800,
                    mb: 4,
                    background: 'linear-gradient(to right, #2563eb, #db2777, #2563eb)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'shine 4s linear infinite'
                }}>
                    LiveMeetAI
                </Typography>

                <div style={{ display: "flex", gap: "10px", marginBottom: "20px", background: "rgba(0,0,0,0.05)", padding: "5px", borderRadius: "50px" }}>
                    <Button 
                        variant={formState === 0 ? "contained" : "text"} 
                        onClick={() => { setFormState(0); setError(""); }}
                        sx={{
                            borderRadius: "50px",
                            px: 4,
                            py: 1,
                            backgroundColor: formState === 0 ? "#0f172a" : "transparent",
                            color: formState === 0 ? "white" : "#475569",
                            '&:hover': {
                                backgroundColor: formState === 0 ? "#1e293b" : "rgba(0,0,0,0.05)"
                            }
                        }}
                    >
                        Sign In
                    </Button>
                    <Button 
                        variant={formState === 1 ? "contained" : "text"} 
                        onClick={() => { setFormState(1); setError(""); }}
                        sx={{
                            borderRadius: "50px",
                            px: 4,
                            py: 1,
                            backgroundColor: formState === 1 ? "#0f172a" : "transparent",
                            color: formState === 1 ? "white" : "#475569",
                            '&:hover': {
                                backgroundColor: formState === 1 ? "#1e293b" : "rgba(0,0,0,0.05)"
                            }
                        }}
                    >
                        Sign Up
                    </Button>
                </div>

                <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        value={username}
                        autoFocus
                        onChange={(e) => setUsername(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.7)',
                            }
                        }}
                    />
                    {formState === 1 && (
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="name"
                            value={name}
                            label="Full Name"
                            type="text"
                            id="name"
                            onChange={(e) => setName(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                }
                            }}
                        />
                    )}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        value={password}
                        type="password"
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.7)',
                            }
                        }}
                    />
                    <p style={{ color: "#ef4444", fontWeight: 500, textAlign: 'center', minHeight: '24px', margin: '10px 0' }}>{error}</p>
                    
                    <div role='button' onClick={handleAuth} style={{ width: '100%', cursor: 'pointer', textAlign: 'center', marginTop: '10px' }}>
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
                            {formState === 0 ? "Login" : "Register"}
                        </a>
                    </div>
                </Box>
            </Box>
            <Snackbar open={open} autoHideDuration={4000} message={message} />
        </div>
    </ThemeProvider>
  );
}