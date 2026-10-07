export const sendOtpEmail = async (email, otp) => {
    if (!process.env.BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY is not configured");
    }

    if (!process.env.MAIL_FROM) {
        throw new Error("MAIL_FROM is not configured");
    }

    const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
            method: "POST",
            headers: {
                accept: "application/json",
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    email: process.env.MAIL_FROM,
                    name: "BrainFlow",
                },
                to: [
                    {
                        email,
                    },
                ],
                subject: "BrainFlow Password Reset OTP",
                textContent: `Your BrainFlow password reset OTP is ${otp}.

This OTP will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>BrainFlow Password Reset</h2>

                        <p>Your password reset OTP is:</p>

                        <h1 style="letter-spacing: 6px;">
                            ${otp}
                        </h1>

                        <p>
                            This OTP will expire in
                            <strong>10 minutes</strong>.
                        </p>

                        <p>
                            If you did not request a password reset,
                            you can safely ignore this email.
                        </p>

                        <p>
                            — BrainFlow
                        </p>
                    </div>
                `,
            }),
        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error("BREVO API ERROR:", {
            status: response.status,
            data,
        });

        throw new Error(
            data?.message ||
            `Brevo email request failed with status ${response.status}`
        );
    }

    console.log(
        "OTP email sent through Brevo:",
        data.messageId
    );

    return data;
};