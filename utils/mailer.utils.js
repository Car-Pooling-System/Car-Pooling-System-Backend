import nodemailer from "nodemailer";

/* ─── Transport ─────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ─── Helpers ───────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

/* ─── Booking Confirmation Email ────────────────────────────── */
/**
 * @param {Object} opts
 * @param {string} opts.to           - rider email
 * @param {string} opts.riderName    - rider display name
 * @param {string} opts.rideId       - MongoDB ride _id
 * @param {string} opts.from         - route start name
 * @param {string} opts.to_place     - route end name
 * @param {string} opts.pickupName   - rider's pickup name
 * @param {string} opts.dropName     - rider's drop name
 * @param {Date|string} opts.departureTime
 * @param {string} opts.driverName
 * @param {number} opts.farePaid
 * @param {string} [opts.vehicleInfo] - e.g. "Honda City (2022) · White"
 */
export async function sendBookingConfirmation(opts) {
  const {
    to,
    riderName,
    rideId,
    from,
    to_place,
    pickupName,
    dropName,
    departureTime,
    driverName,
    farePaid,
    vehicleInfo,
  } = opts;

  const WEB_URL   = process.env.WEB_URL;
  const APP_SCHEME = process.env.APP_SCHEME || "my-clerk-app";

  const webLink = `${WEB_URL}/rides/${rideId}`;
  const appLink = `${APP_SCHEME}:///(rider)/search/details?rideId=${rideId}&isBooked=1`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ride Booking Confirmed</title>
  <style>
    body { margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background:#f3f4f6; }
    .wrapper { max-width:560px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header  { background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%); padding:32px 32px 24px; text-align:center; }
    .header h1 { margin:0; color:#ffffff; font-size:22px; font-weight:800; letter-spacing:0.3px; }
    .header p  { margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:13px; }
    .body    { padding:32px; }
    .badge   { display:inline-flex; align-items:center; gap:6px; background:#ecfdf5; color:#059669; font-size:12px; font-weight:700; padding:6px 14px; border-radius:999px; margin-bottom:24px; }
    .section { margin-bottom:20px; background:#f9fafb; border-radius:12px; padding:16px 18px; }
    .section h3 { margin:0 0 10px; font-size:11px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; }
    .row     { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
    .row:last-child { margin-bottom:0; }
    .label   { font-size:12px; color:#6b7280; }
    .value   { font-size:13px; color:#111827; font-weight:600; text-align:right; max-width:60%; }
    .route   { display:flex; flex-direction:column; gap:10px; }
    .route-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:3px; }
    .route-row { display:flex; align-items:flex-start; gap:10px; }
    .route-line{ width:2px; height:20px; background:#e5e7eb; margin-left:4px; }
    .fare-box { background:linear-gradient(135deg,#4f46e5,#7c3aed); border-radius:12px; padding:16px 18px; display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .fare-box .fare-label { color:rgba(255,255,255,0.8); font-size:12px; }
    .fare-box .fare-amount { color:#ffffff; font-size:22px; font-weight:800; }
    .cta     { text-align:center; margin-top:28px; }
    .btn     { display:inline-block; padding:12px 28px; border-radius:10px; font-size:14px; font-weight:700; text-decoration:none; margin:0 6px; }
    .btn-primary  { background:#4f46e5; color:#ffffff; }
    .btn-secondary{ background:#f3f4f6; color:#374151; }
    .footer  { text-align:center; padding:20px; background:#f9fafb; }
    .footer p{ margin:0; font-size:11px; color:#9ca3af; }
  </style>
</head>
<body>
<div class="wrapper">
  <!-- Header -->
  <div class="header">
    <h1>🎉 Ride Booking Confirmed!</h1>
    <p>Hi ${riderName}, your seat is reserved.</p>
  </div>

  <div class="body">
    <div class="badge">✓ Booking Confirmed</div>

    <!-- Date / Time -->
    <div class="section">
      <h3>Trip Details</h3>
      <div class="row">
        <span class="label">Date</span>
        <span class="value">${fmtDate(departureTime)}</span>
      </div>
      <div class="row">
        <span class="label">Departure Time</span>
        <span class="value">${fmtTime(departureTime)}</span>
      </div>
    </div>

    <!-- Route -->
    <div class="section">
      <h3>Route</h3>
      <div class="route">
        <div class="route-row">
          <div class="route-dot" style="background:#4f46e5;"></div>
          <span style="font-size:13px;color:#111827;font-weight:600;">${from}</span>
        </div>
        <div class="route-row" style="margin-left:0;">
          <div class="route-line"></div>
        </div>
        <div class="route-row">
          <div class="route-dot" style="background:#ef4444;"></div>
          <span style="font-size:13px;color:#111827;font-weight:600;">${to_place}</span>
        </div>
      </div>
    </div>

    <!-- Your Pickup / Drop -->
    <div class="section">
      <h3>Your Journey</h3>
      <div class="row">
        <span class="label">Pickup</span>
        <span class="value">${pickupName}</span>
      </div>
      <div class="row">
        <span class="label">Drop-off</span>
        <span class="value">${dropName}</span>
      </div>
    </div>

    <!-- Driver / Vehicle -->
    <div class="section">
      <h3>Driver & Vehicle</h3>
      <div class="row">
        <span class="label">Driver</span>
        <span class="value">${driverName}</span>
      </div>
      ${vehicleInfo ? `<div class="row"><span class="label">Vehicle</span><span class="value">${vehicleInfo}</span></div>` : ""}
    </div>

    <!-- Fare -->
    <div class="fare-box">
      <div>
        <div class="fare-label">Estimated Fare Paid</div>
        <div class="fare-amount">₹${farePaid}</div>
      </div>
      <span style="font-size:28px;">🧾</span>
    </div>

    <!-- CTAs -->
    <div class="cta">
      <p style="font-size:13px;color:#6b7280;margin-bottom:16px;">View your ride details:</p>
      <a href="${webLink}" class="btn btn-primary">🌐 View on Web</a>
      <a href="${appLink}" class="btn btn-secondary">📱 Open in App</a>
    </div>
  </div>

  <div class="footer">
    <p>CarPoolingSystem · You received this because you booked a ride.</p>
    <p style="margin-top:4px;">Ride ID: ${rideId}</p>
  </div>
</div>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"CarPoolingSystem" <${process.env.SMTP_USER}>`,
    to,
    subject: `🎉 Ride Confirmed – ${fmtDate(departureTime)} · ₹${farePaid}`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Booking confirmation email sent:", info.messageId);
    return info;
  } catch (err) {
    // Non-fatal – log and continue so booking itself doesn't fail
    console.error("Failed to send booking email:", err.message);
    return null;
  }
}

/* ─── Ride Started Email ────────────────────────────────────── */
/**
 * @param {Object} opts
 * @param {string} opts.to           - rider email
 * @param {string} opts.riderName    - rider display name
 * @param {string} opts.rideId       - MongoDB ride _id
 * @param {string} opts.from         - route start name
 * @param {string} opts.to_place     - route end name
 * @param {Date|string} opts.departureTime
 * @param {string} opts.driverName
 */
export async function sendRideStartedEmail(opts) {
  const {
    to,
    riderName,
    rideId,
    from,
    to_place,
    departureTime,
    driverName,
  } = opts;

  const APP_SCHEME = process.env.APP_SCHEME || "my-clerk-app";
  const appLink = `${APP_SCHEME}:///(rider)/bookings/live-ride?rideId=${rideId}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Ride Has Started!</title>
  <style>
    body { margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background:#f3f4f6; }
    .wrapper { max-width:560px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header  { background:linear-gradient(135deg,#059669 0%,#10b981 100%); padding:32px 32px 24px; text-align:center; }
    .header h1 { margin:0; color:#ffffff; font-size:22px; font-weight:800; letter-spacing:0.3px; }
    .header p  { margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:13px; }
    .body    { padding:32px; }
    .badge   { display:inline-flex; align-items:center; gap:6px; background:#ecfdf5; color:#059669; font-size:12px; font-weight:700; padding:6px 14px; border-radius:999px; margin-bottom:24px; }
    .section { margin-bottom:20px; background:#f9fafb; border-radius:12px; padding:16px 18px; }
    .section h3 { margin:0 0 10px; font-size:11px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; }
    .row     { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
    .row:last-child { margin-bottom:0; }
    .label   { font-size:12px; color:#6b7280; }
    .value   { font-size:13px; color:#111827; font-weight:600; text-align:right; max-width:60%; }
    .cta     { text-align:center; margin-top:28px; }
    .btn     { display:inline-block; padding:14px 32px; border-radius:10px; font-size:14px; font-weight:700; text-decoration:none; background:#059669; color:#ffffff; }
    .footer  { text-align:center; padding:20px; background:#f9fafb; }
    .footer p{ margin:0; font-size:11px; color:#9ca3af; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🚗 Your Ride Has Started!</h1>
    <p>Hi ${riderName}, your driver is on the way.</p>
  </div>
  <div class="body">
    <div class="badge">🟢 Ride Active</div>
    <div class="section">
      <h3>Trip Details</h3>
      <div class="row">
        <span class="label">Date</span>
        <span class="value">${fmtDate(departureTime)}</span>
      </div>
      <div class="row">
        <span class="label">From</span>
        <span class="value">${from}</span>
      </div>
      <div class="row">
        <span class="label">To</span>
        <span class="value">${to_place}</span>
      </div>
      <div class="row">
        <span class="label">Driver</span>
        <span class="value">${driverName}</span>
      </div>
    </div>
    <div class="cta">
      <p style="font-size:13px;color:#6b7280;margin-bottom:16px;">Open the app to track your ride live and signal when you're ready for pickup.</p>
      <a href="${appLink}" class="btn">📱 Open Live Ride</a>
    </div>
  </div>
  <div class="footer">
    <p>CarPoolingSystem · Your ride is underway!</p>
    <p style="margin-top:4px;">Ride ID: ${rideId}</p>
  </div>
</div>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"CarPoolingSystem" <${process.env.SMTP_USER}>`,
    to,
    subject: `🚗 Ride Started – ${driverName} is on the way! · ${fmtDate(departureTime)}`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Ride started email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Failed to send ride started email:", err.message);
    return null;
  }
}

/* ─── SOS Alert Email ───────────────────────────────────────── */
/**
 * @param {Object} opts
 * @param {string} opts.to           - emergency contact email
 * @param {string} opts.contactName  - emergency contact name
 * @param {string} opts.riderName    - rider display name
 * @param {string} opts.rideId       - MongoDB ride _id
 * @param {string} opts.locationUrl  - Google Maps URL of current location
 */
export async function sendSOSEmail(opts) {
  const { to, contactName, riderName, rideId, locationUrl } = opts;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>🚨 SOS ALERT</title>
  <style>
    body { margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background:#fef2f2; }
    .wrapper { max-width:560px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.12); }
    .header  { background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%); padding:32px 32px 24px; text-align:center; }
    .header h1 { margin:0; color:#ffffff; font-size:24px; font-weight:800; }
    .header p  { margin:8px 0 0; color:rgba(255,255,255,0.9); font-size:14px; }
    .body    { padding:32px; }
    .alert-box { background:#fef2f2; border:2px solid #fca5a5; border-radius:12px; padding:20px; margin-bottom:24px; text-align:center; }
    .alert-box h2 { margin:0 0 8px; color:#dc2626; font-size:18px; }
    .alert-box p  { margin:0; color:#991b1b; font-size:14px; }
    .section { margin-bottom:16px; background:#f9fafb; border-radius:12px; padding:16px 18px; }
    .section h3 { margin:0 0 8px; font-size:11px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#9ca3af; }
    .row     { display:flex; justify-content:space-between; margin-bottom:6px; }
    .label   { font-size:12px; color:#6b7280; }
    .value   { font-size:13px; color:#111827; font-weight:600; }
    .cta     { text-align:center; margin-top:24px; }
    .btn     { display:inline-block; padding:14px 32px; border-radius:10px; font-size:14px; font-weight:700; text-decoration:none; background:#dc2626; color:#ffffff; }
    .footer  { text-align:center; padding:20px; background:#fef2f2; }
    .footer p{ margin:0; font-size:11px; color:#9ca3af; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🚨 SOS EMERGENCY ALERT</h1>
    <p>${riderName} needs your help!</p>
  </div>
  <div class="body">
    <div class="alert-box">
      <h2>⚠️ Emergency Alert Triggered</h2>
      <p>Hi ${contactName}, <strong>${riderName}</strong> has triggered an SOS alert during their ride. They may need immediate assistance.</p>
    </div>
    <div class="section">
      <h3>Details</h3>
      <div class="row">
        <span class="label">Rider</span>
        <span class="value">${riderName}</span>
      </div>
      ${rideId ? `<div class="row"><span class="label">Ride ID</span><span class="value">${rideId}</span></div>` : ""}
      <div class="row">
        <span class="label">Time</span>
        <span class="value">${new Date().toLocaleString("en-IN")}</span>
      </div>
    </div>
    ${locationUrl && locationUrl !== "Location unavailable" ? `
    <div class="cta">
      <p style="font-size:13px;color:#6b7280;margin-bottom:16px;">View their last known location:</p>
      <a href="${locationUrl}" class="btn">📍 View Location on Map</a>
    </div>` : `
    <div class="alert-box" style="border-color:#fcd34d;background:#fffbeb;">
      <p style="color:#92400e;">Location was unavailable at the time of the alert.</p>
    </div>`}
  </div>
  <div class="footer">
    <p>CarPoolingSystem · Emergency SOS Alert</p>
    <p style="margin-top:4px;">Please contact ${riderName} or local authorities immediately.</p>
  </div>
</div>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"CarPoolingSystem SOS" <${process.env.SMTP_USER}>`,
    to,
    subject: `🚨 SOS ALERT — ${riderName} needs help!`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("SOS email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Failed to send SOS email:", err.message);
    return null;
  }
}
