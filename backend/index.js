const express  = require('express');
const cors     = require('cors');
const admin    = require('firebase-admin');
const crypto   = require('crypto');
const Razorpay = require('razorpay');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// ── Razorpay client ────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Google OAuth client ────────────────────────────────────────────────────
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Firebase Admin ─────────────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db  = admin.firestore();
const app = express();

// ── CORS — must be first middleware ────────────────────────────────────────
app.use(cors());

// ── Webhook route — needs raw body, MUST come before express.json() ────────
app.post(
  '/api/razorpay-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature  = req.headers['x-razorpay-signature'];
      const bodyString = req.body.toString();

      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(bodyString)
        .digest('hex');

      if (signature !== expected) {
        console.warn('Invalid webhook signature');
        return res.status(400).send('Invalid signature');
      }

      const event = JSON.parse(bodyString);
      console.log('Webhook received:', event.event);

      if (event.event === 'payment_link.paid') {
        const linkId = event.payload.payment_link.entity.id;
        const txnId  = event.payload.payment.entity.id;

        await db.collection('pendingPayments').doc(linkId).update({
          status:        'paid',
          transactionId: txnId,
          paidAt:        admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Webhook: payment confirmed for link ${linkId}`);
      }

      res.json({ status: 'ok' });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── JSON body parser — after webhook ──────────────────────────────────────
app.use(express.json());

// ============================================================
// GOOGLE AUTH
// ============================================================

// POST /api/auth/google
// Frontend sends the Google credential (ID token) here.
// We verify it, find-or-create the Firebase user, and return
// a Firebase custom token so the frontend can call
// signInWithCustomToken(auth, customToken).
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Step 1: Verify the Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken:  credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr.message);
      return res.status(401).json({ error: 'Invalid Google token. Please try again.' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google account has no email address.' });
    }

    console.log(`Google auth: ${email} (${name})`);

    // Step 2: Find or create the user in Firebase Auth
    let firebaseUid;

    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      firebaseUid = existingUser.uid;
      console.log(`Existing Firebase user: ${firebaseUid}`);

      // Update profile photo if missing
      if (picture && !existingUser.photoURL) {
        await admin.auth().updateUser(firebaseUid, { photoURL: picture });
      }
    } catch (getUserErr) {
      if (getUserErr.code === 'auth/user-not-found') {
        // Create new Firebase user
        const newUser = await admin.auth().createUser({
          uid:           `google_${googleId}`,
          email,
          displayName:   name    || email.split('@')[0],
          photoURL:      picture || null,
          emailVerified: true,
        });
        firebaseUid = newUser.uid;
        console.log(`Created new Firebase user: ${firebaseUid} (${email})`);

        // Save profile to Firestore
        await db.collection('users').doc(firebaseUid).set({
          email,
          displayName:   name    || '',
          photoURL:      picture || '',
          provider:      'google',
          loyaltyPoints: 0,
          createdAt:     admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        throw getUserErr;
      }
    }

    // Step 3: Create Firebase custom token
    const customToken = await admin.auth().createCustomToken(firebaseUid, {
      provider: 'google',
      email,
    });

    console.log(`Custom token created for ${email}`);

    res.json({
      customToken,
      user: {
        uid:         firebaseUid,
        email,
        displayName: name    || '',
        photoURL:    picture || '',
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// ============================================================
// MENU ROUTES
// ============================================================

app.get('/api/menu', async (req, res) => {
  try {
    const snapshot = await db.collection('menu').get();
    const menu = [];
    snapshot.forEach(doc => menu.push({ id: doc.id, ...doc.data() }));
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const { name, price, category, imageUrl, prepTime, description } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

    const newItem = {
      name,
      price:       parseFloat(price),
      category:    category    || 'Other',
      imageUrl:    imageUrl    || null,
      description: description || '',
      prepTime:    parseInt(prepTime) || 10,
      inStock:     true,
      available:   true,
      createdAt:   admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('menu').add(newItem);
    res.json({ id: docRef.id, ...newItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, available, category, imageUrl, prepTime, description } = req.body;
    const docRef = db.collection('menu').doc(id);
    const doc    = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Menu item not found' });

    const e = doc.data();
    await docRef.update({
      name:        name        || e.name,
      price:       price       ? parseFloat(price) : e.price,
      available:   available   !== undefined ? Boolean(available) : e.available,
      category:    category    || e.category,
      imageUrl:    imageUrl    !== undefined ? imageUrl : e.imageUrl,
      description: description !== undefined ? description : (e.description || ''),
      prepTime:    prepTime    ? parseInt(prepTime) : (e.prepTime || 10),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id/stock', async (req, res) => {
  try {
    const { id }      = req.params;
    const { inStock } = req.body;
    if (inStock === undefined) return res.status(400).json({ error: 'inStock field is required' });

    const docRef = db.collection('menu').doc(id);
    const doc    = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Menu item not found' });

    await docRef.update({ inStock: Boolean(inStock), available: Boolean(inStock) });
    res.json({ success: true, inStock: Boolean(inStock) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    const docRef = db.collection('menu').doc(req.params.id);
    const doc    = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Menu item not found' });
    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ORDER ROUTES
// ============================================================

app.post('/api/orders', async (req, res) => {
  try {
    const {
      userId, items, total, deliveryName, deliveryLocation,
      eta, pointsEarned,
      paymentMethod, razorpayLinkId, paymentStatus, status,
    } = req.body;

    if (!userId || !items || total == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newOrder = {
      userId,
      items,
      total:            parseFloat(total),
      status:           status          || 'Pending',
      paymentMethod:    paymentMethod   || 'cod',
      paymentStatus:    paymentStatus   || 'pending',
      razorpayLinkId:   razorpayLinkId  || null,
      timestamp:        admin.firestore.FieldValue.serverTimestamp(),
      deliveryName:     deliveryName    || '',
      deliveryLocation: deliveryLocation || '',
      eta:              eta             || null,
      pointsEarned:     pointsEarned    || 0,
    };

    const docRef = await db.collection('orders').add(newOrder);
    console.log(`New order: ${docRef.id} | ${paymentMethod} | Rs.${total}`);
    res.json({ id: docRef.id, ...newOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('timestamp', 'desc').get();
    const orders = [];
    snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ Must be before /api/orders/:id to avoid route conflict
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const snapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .get();

    const orders = [];
    snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (err) {
    if (err.code === 9) {
      return res.status(500).json({ error: 'Missing Firestore index. Create composite index for userId + timestamp.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;
    const docRef     = db.collection('orders').doc(id);
    const doc        = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    await docRef.update({ status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await db.collection('orders').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// LOYALTY ROUTES
// ============================================================

app.get('/api/loyalty/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const docRef     = db.collection('users').doc(userId);
    const doc        = await docRef.get();
    if (!doc.exists) return res.json({ userId, loyaltyPoints: 0, tier: 'Bronze' });

    const points = doc.data().loyaltyPoints || 0;
    const tier   = points >= 500 ? 'Gold' : points >= 200 ? 'Silver' : 'Bronze';
    res.json({ userId, loyaltyPoints: points, tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/loyalty/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;
    if (!points || points <= 0) return res.status(400).json({ error: 'points must be positive' });

    const docRef = db.collection('users').doc(userId);
    const doc    = await docRef.get();

    if (!doc.exists) {
      await docRef.set({ loyaltyPoints: points, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      await docRef.update({ loyaltyPoints: admin.firestore.FieldValue.increment(points) });
    }

    const updated = await docRef.get();
    const total   = updated.data().loyaltyPoints;
    const tier    = total >= 500 ? 'Gold' : total >= 200 ? 'Silver' : 'Bronze';
    res.json({ success: true, loyaltyPoints: total, tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PAYMENT ROUTES
// ============================================================

app.post('/api/create-payment-qr', async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    const link = await razorpay.paymentLink.create({
      amount:      Math.round(amount * 100),
      currency:    'INR',
      description: `Annapurna Canteen - Order ${orderId}`,
      customer:    { name: 'Customer' },
      expire_by:   Math.floor(Date.now() / 1000) + 600,
    });

    await db.collection('pendingPayments').doc(link.id).set({
      orderId,
      amount,
      status:    'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Payment link created: ${link.id} for Rs.${amount}`);
    res.json({ qrId: link.id, paymentUrl: link.short_url });
  } catch (err) {
    console.error('Payment link error:', err?.error || err);
    res.status(500).json({ error: err?.error?.description || err.message });
  }
});

// Checks Firestore first (webhook fast path), then hits Razorpay API directly
// (fixes the bug where webhook never fires and status stays "pending" forever)
app.get('/api/payment-status/:qrId', async (req, res) => {
  try {
    const { qrId } = req.params;
    const docRef   = db.collection('pendingPayments').doc(qrId);
    const doc      = await docRef.get();

    if (!doc.exists) return res.status(404).json({ status: 'not_found' });

    const data = doc.data();

    // Fast path: webhook already updated Firestore
    if (data.status === 'paid') {
      return res.json({ status: 'paid', transactionId: data.transactionId || null });
    }

    // Slow path: call Razorpay API directly — no webhook dependency
    try {
      const paymentLink = await razorpay.paymentLink.fetch(qrId);
      console.log(`Razorpay API status for ${qrId}: ${paymentLink.status}`);

      if (paymentLink.status === 'paid') {
        let txnId = null;
        try {
          const payments = await razorpay.paymentLink.fetchPayments(qrId);
          txnId = payments?.items?.[0]?.payment_id || null;
        } catch (_) {}

        await docRef.update({
          status:        'paid',
          transactionId: txnId,
          paidAt:        admin.firestore.FieldValue.serverTimestamp(),
          detectedBy:    'api-poll',
        });

        console.log(`Payment confirmed via API poll: ${qrId}`);
        return res.json({ status: 'paid', transactionId: txnId });
      }

      return res.json({ status: paymentLink.status || 'pending' });
    } catch (rzErr) {
      console.error(`Razorpay API error for ${qrId}:`, rzErr?.error?.description || rzErr.message);
      return res.json({ status: data.status });
    }
  } catch (err) {
    console.error('Payment status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});