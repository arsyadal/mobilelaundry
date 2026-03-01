import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import serviceRoutes from './modules/services/services.routes';
import orderRoutes from './modules/orders/orders.routes';
import paymentRoutes from './modules/payments/payments.routes';
import adminOrderRoutes from './modules/orders/adminOrders.routes';
import adminPaymentRoutes from './modules/payments/adminPayments.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import userRoutes from './modules/users/users.routes';
import notificationRoutes from './modules/notifications/notifications.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/services', serviceRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Uploads served at http://0.0.0.0:${PORT}/uploads`);
});

export default app;
