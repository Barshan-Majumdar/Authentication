export function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtpHtml(otp) {
    return `
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Email Verification</h2>
                <p>Hello,</p>
                <p>Your One-Time Password (OTP) for email verification is:</p>
                <div style="background-color: #f0f0f0; padding: 10px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #333; letter-spacing: 5px;">${otp}</h1>
                </div>
                <p>This OTP will expire in 5 minutes.</p>
                <p>If you did not request this verification, please ignore this email.</p>
                <p>Best regards,<br>The Authentication Team</p>
            </body>
        </html>
    `;
}