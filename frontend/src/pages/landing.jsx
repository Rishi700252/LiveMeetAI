import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'
export default function LandingPage() {


    const router = useNavigate();

    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>LiveMeetAI</h2>
                </div>
                <div className='navlist'>
                    <p onClick={() => {
                        const randomCode = Math.random().toString(36).substring(2, 8);
                        router(`/${randomCode}`)
                    }}>Join as Guest</p>
                    <p onClick={() => {
                        router("/auth")

                    }}>Register</p>
                    <div onClick={() => {
                        router("/auth")

                    }} role='button'>
                        <p>Login</p>
                    </div>
                </div>
            </nav>


            <div className="landingMainContainer">
                <div>
                    <h1>Next-Gen <span>Video Meetings</span> for Everyone</h1>

                    <p>Connect, collaborate, and celebrate from anywhere with LiveMeetAI.</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div>

                    <img src="/hero_image.jpg" alt="" />

                </div>
            </div>



        </div>
    )
}