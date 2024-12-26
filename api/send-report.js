export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, threatType, description, token } = req.body;

  if (!name || !email || !threatType || !description || !token) {
    return res.status(400).json({ error: 'All fields are required, including reCAPTCHA token.' });
  }

  // Validate reCAPTCHA
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const verifyURL = `https://www.google.com/recaptcha/api/siteverify`;

  try {
    const recaptchaResponse = await fetch(verifyURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const recaptchaData = await recaptchaResponse.json();

    if (!recaptchaData.success) {
      return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
    }
  } catch (error) {
    console.error('reCAPTCHA validation error:', error);
    return res.status(500).json({ error: 'Failed to validate reCAPTCHA.' });
  }

  // Proceed with sending the report
  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  const message = `New Threat Report:\n\nName: ${name}\nEmail: ${email}\nType of Threat: ${threatType}\nDescription: ${description}`;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.ok) {
      return res.status(200).json({ success: true, message: 'Report sent successfully!' });
    } else {
      return res.status(500).json({ success: false, error: 'Failed to send report.' });
    }
  } catch (error) {
    console.error('Error sending report:', error);
    return res.status(500).json({ success: false, error: 'An error occurred.' });
  }
}
