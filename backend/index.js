const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

require('dotenv').config();
const Razorpay = require('razorpay');
const crypto   = require('crypto');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Firebase Admin
// const serviceAccount = require('./firebase-adminsdk.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   projectId: process.env.FIREBASE_PROJECT_ID,
// });
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();
const app = express();

// ⚠️ Webhook route MUST be before express.json() to access raw body
app.post(
  '/api/razorpay-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature  = req.headers['x-razorpay-signature'];
      const bodyString = req.body.toString();

      // Verify signature
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(bodyString)
        .digest('hex');

      if (signature !== expected) {
        console.warn('Invalid webhook signature');
        return res.status(400).send('Invalid signature');
      }

        const event = JSON.parse(bodyString);
        if (event.event === 'payment_link.paid') {
          const qrId  = event.payload.payment_link.entity.id;
          const txnId = event.payload.payment.entity.id;

          await db.collection('pendingPayments').doc(qrId).update({
          status:        'paid',
          transactionId: txnId,
          paidAt:        admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ Payment confirmed for QR: ${qrId}, TXN: ${txnId}`);
      }

      res.json({ status: 'ok' });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

app.use(express.json());
app.use(cors());

// ============================================================
// ===== MENU ROUTES ==========================================
// ============================================================

// ===== GET /api/menu =====
// Returns ALL menu items (in stock and out of stock)
// Frontend handles OOS display — admin needs to see everything too
app.get('/api/menu', async (req, res) => {
  try {
    const snapshot = await db.collection('menu').get();
    const menu = [];
    snapshot.forEach(doc => {
      menu.push({ id: doc.id, ...doc.data() });
    });
    res.json(menu);
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== POST /api/menu =====
// Now also saves: prepTime, description, inStock
app.post('/api/menu', async (req, res) => {
  try {
    const { name, price, category, imageUrl, prepTime, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const newItem = {
      name,
      price:       parseFloat(price),
      category:    category    || 'Other',
      imageUrl:    imageUrl    || null,
      description: description || '',
      prepTime:    parseInt(prepTime) || 10, // ← NEW: prep time in minutes
      inStock:     true,                     // ← NEW: default available
      available:   true,                     // keep old field for compatibility
      createdAt:   admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('menu').add(newItem);
    res.json({ id: docRef.id, ...newItem });
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== PUT /api/menu/:id =====
// Now also updates: prepTime, description
app.put('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, available, category, imageUrl, prepTime, description } = req.body;

    const docRef = db.collection('menu').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const existing = doc.data();

    await docRef.update({
      name:        name        || existing.name,
      price:       price       ? parseFloat(price) : existing.price,
      available:   available   !== undefined ? Boolean(available) : existing.available,
      category:    category    || existing.category,
      imageUrl:    imageUrl    !== undefined ? imageUrl : existing.imageUrl,
      description: description !== undefined ? description : (existing.description || ''),
      prepTime:    prepTime    ? parseInt(prepTime) : (existing.prepTime || 10), // ← NEW
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== PUT /api/menu/:id/stock =====  ← NEW ROUTE
// Toggles inStock true/false — called by Admin "In Stock / OOS" button
app.put('/api/menu/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { inStock } = req.body;

    if (inStock === undefined) {
      return res.status(400).json({ error: 'inStock field is required' });
    }

    const docRef = db.collection('menu').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    await docRef.update({
      inStock:   Boolean(inStock),
      available: Boolean(inStock), // keep both fields in sync
    });

    console.log(`✅ Stock updated for ${id}: inStock = ${inStock}`);
    res.json({ success: true, inStock: Boolean(inStock) });
  } catch (err) {
    console.error('Error updating stock status:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== DELETE /api/menu/:id =====
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('menu').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ===== ORDER ROUTES =========================================
// ============================================================

// ===== POST /api/orders =====
// Now also saves: eta, pointsEarned
app.post('/api/orders', async (req, res) => {
  try {
    const {
      userId,
      items,
      total,
      deliveryName,
      deliveryLocation,
      eta,          // ← NEW: estimated delivery time string e.g. "20–25 mins"
      pointsEarned, // ← NEW: loyalty points earned on this order
    } = req.body;

    if (!userId || !items || total == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newOrder = {
      userId,
      items,
      total:            parseFloat(total),
      status:           'Pending',
      timestamp:        admin.firestore.FieldValue.serverTimestamp(),
      deliveryName:     deliveryName     || '',
      deliveryLocation: deliveryLocation || '',
      eta:              eta              || null, // ← NEW
      pointsEarned:     pointsEarned     || 0,   // ← NEW
    };

    const docRef = await db.collection('orders').add(newOrder);
    res.json({ id: docRef.id, ...newOrder });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== GET /api/orders (Admin — all orders) =====
app.get('/api/orders', async (req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('timestamp', 'desc').get();
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== GET /api/orders/user/:userId (Student — their own orders) =====
// ⚠️  Must be defined BEFORE /api/orders/:id to avoid route conflict
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('🔍 Fetching orders for userId:', userId);

    const snapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .get();

    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    console.log('✅ Found orders:', orders.length);
    res.json(orders);
  } catch (err) {
    console.error('❌ Error fetching user orders:', err);
    if (err.code === 9) {
      return res.status(500).json({
        error: 'Missing Firestore index. Create composite index for userId + timestamp in Firebase console.',
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// ===== PUT /api/orders/:id/status =====
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const docRef = db.collection('orders').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await docRef.update({ status });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== DELETE /api/orders/:id =====
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('orders').doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ===== LOYALTY POINTS ROUTES ================================  ← NEW SECTION
// ============================================================

// ===== GET /api/loyalty/:userId =====
// Get a user's current loyalty points
app.get('/api/loyalty/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const docRef = db.collection('users').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // User doc doesn't exist yet — return 0 points
      return res.json({ userId, loyaltyPoints: 0, tier: 'Bronze' });
    }

    const points = doc.data().loyaltyPoints || 0;
    const tier   = points >= 500 ? 'Gold' : points >= 200 ? 'Silver' : 'Bronze';

    res.json({ userId, loyaltyPoints: points, tier });
  } catch (err) {
    console.error('Error fetching loyalty points:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== POST /api/loyalty/:userId/add =====
// Add points to a user after a purchase
// Body: { points: 20 }
app.post('/api/loyalty/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'points must be a positive number' });
    }

    const docRef = db.collection('users').doc(userId);
    const doc    = await docRef.get();

    if (!doc.exists) {
      // Create user doc with initial points
      await docRef.set({ loyaltyPoints: points, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      // Increment existing points
      await docRef.update({
        loyaltyPoints: admin.firestore.FieldValue.increment(points),
      });
    }

    const updated = await docRef.get();
    const total   = updated.data().loyaltyPoints;
    const tier    = total >= 500 ? 'Gold' : total >= 200 ? 'Silver' : 'Bronze';

    console.log(`⭐ +${points} pts for user ${userId} → total: ${total} (${tier})`);
    res.json({ success: true, loyaltyPoints: total, tier });
  } catch (err) {
    console.error('Error adding loyalty points:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ===== PAYMENT ROUTES =======================================  ← NEW SECTION
// ============================================================

// ── ROUTE 1: Create Razorpay UPI QR for an order ──────────────────────────
app.post('/api/create-payment-qr', async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    const link = await razorpay.paymentLink.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      description: `Order ${orderId}`,
      customer: {
        name: "Customer",
      },
    });

    await db.collection('pendingPayments').doc(link.id).set({
      orderId,
      amount,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      qrId: link.id,
      paymentUrl: link.short_url,
    });

  } catch (err) {
    console.error("Payment link error:", err?.error || err);
    res.status(500).json({ error: err?.error || err.message });
  }
});

// ── ROUTE 2: Frontend polls this every 3 sec to check if paid ─────────────
app.get('/api/payment-status/:qrId', async (req, res) => {
  try {
    const doc = await db.collection('pendingPayments').doc(req.params.qrId).get();
    if (!doc.exists) return res.status(404).json({ status: 'not_found' });
    res.json({ status: doc.data().status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("server mast chal rha hai port", PORT, "pe");
});