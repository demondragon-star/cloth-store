// Payment Service - Demo Implementation
// Note: This is a simulated payment service for demonstration purposes
// In production, integrate with actual payment gateways (Razorpay, Stripe, etc.)
import { Order, PaymentMethod } from '../types';

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}

export interface PaymentOptions {
    orderId: string;
    amount: number;
    currency?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    description?: string;
}

class PaymentService {
    // Simulated payment processing delay
    private readonly PROCESSING_DELAY = 2000;

    /**
     * Process payment (Demo implementation - simulates successful payment)
     * In production, this would integrate with Razorpay/Stripe
     */
    async processPayment(
        method: PaymentMethod,
        options: PaymentOptions
    ): Promise<PaymentResult> {
        // Simulate payment processing
        await this.delay(this.PROCESSING_DELAY);

        // Generate transaction ID
        const timestamp = Date.now();
        const randomSuffix = timestamp.toString(36).toUpperCase();
        const transactionId = `TXN${timestamp}${randomSuffix}`;

        return {
            success: true,
            transactionId,
        };
    }

    /**
     * Initialize Razorpay checkout (Demo implementation)
     * In production, would open native Razorpay SDK
     */
    async initiateRazorpayPayment(options: PaymentOptions): Promise<PaymentResult> {
        // Simulate Razorpay flow
        await this.delay(this.PROCESSING_DELAY);

        return {
            success: true,
            transactionId: `RZP${Date.now()}`,
        };
    }

    /**
     * Process UPI payment (Demo implementation)
     * In production, would open UPI intent
     */
    async processUPIPayment(
        upiId: string,
        options: PaymentOptions
    ): Promise<PaymentResult> {
        // Validate UPI ID format (basic check)
        if (!this.isValidUPIId(upiId)) {
            return {
                success: false,
                error: 'Invalid UPI ID format',
            };
        }

        await this.delay(this.PROCESSING_DELAY);

        return {
            success: true,
            transactionId: `UPI${Date.now()}`,
        };
    }

    /**
     * Process Card payment (Demo implementation)
     * In production, would use Stripe/Razorpay card flow
     */
    async processCardPayment(
        cardDetails: {
            number: string;
            expiry: string;
            cvv: string;
            name: string;
        },
        options: PaymentOptions
    ): Promise<PaymentResult> {
        // Basic validation
        if (!this.isValidCardNumber(cardDetails.number)) {
            return {
                success: false,
                error: 'Invalid card number',
            };
        }

        await this.delay(this.PROCESSING_DELAY);

        return {
            success: true,
            transactionId: `CARD${Date.now()}`,
        };
    }

    /**
     * Process Net Banking payment (Demo implementation)
     */
    async processNetBankingPayment(
        bankCode: string,
        options: PaymentOptions
    ): Promise<PaymentResult> {
        await this.delay(this.PROCESSING_DELAY);

        return {
            success: true,
            transactionId: `NB${Date.now()}`,
        };
    }

    /**
     * Process Wallet payment (Demo implementation)
     */
    async processWalletPayment(
        walletType: 'paytm' | 'phonepe' | 'googlepay' | 'amazonpay',
        options: PaymentOptions
    ): Promise<PaymentResult> {
        await this.delay(this.PROCESSING_DELAY);

        return {
            success: true,
            transactionId: `WAL${Date.now()}`,
        };
    }

    /**
     * Verify payment status (Demo implementation - always returns success)
     */
    async verifyPayment(transactionId: string): Promise<{
        verified: boolean;
        status: 'success' | 'pending' | 'failed';
    }> {
        await this.delay(500);

        return {
            verified: true,
            status: 'success',
        };
    }

    /**
     * Request refund (Demo implementation)
     */
    async requestRefund(
        transactionId: string,
        amount: number,
        reason?: string
    ): Promise<{
        success: boolean;
        refundId?: string;
        error?: string;
    }> {
        await this.delay(this.PROCESSING_DELAY);

        return {
            success: true,
            refundId: `REF${Date.now()}`,
        };
    }

    // Utility methods
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private isValidUPIId(upiId: string): boolean {
        // Basic UPI ID format: username@bankhandle
        return /^[\w.-]+@[\w]+$/.test(upiId);
    }

    private isValidCardNumber(cardNumber: string): boolean {
        // Remove spaces and check if 16 digits
        const cleaned = cardNumber.replace(/\s/g, '');
        return /^\d{16}$/.test(cleaned);
    }

    /**
     * Get available payment methods
     */
    getAvailablePaymentMethods() {
        return [
            {
                id: 'cod',
                name: 'Cash on Delivery',
                icon: 'cash-outline',
                description: 'Pay when you receive your order',
                enabled: true,
            },
            {
                id: 'card',
                name: 'Credit/Debit Card',
                icon: 'card-outline',
                description: 'Pay using Visa, Mastercard, or Rupay',
                enabled: true,
            },
            {
                id: 'upi',
                name: 'UPI Payment',
                icon: 'phone-portrait-outline',
                description: 'Pay using any UPI app',
                enabled: true,
            },
            {
                id: 'netbanking',
                name: 'Net Banking',
                icon: 'globe-outline',
                description: 'Pay using your bank account',
                enabled: true,
            },
            {
                id: 'wallet',
                name: 'Wallet',
                icon: 'wallet-outline',
                description: 'Paytm, PhonePe, Google Pay',
                enabled: true,
            },
        ];
    }

    /**
     * Get supported banks for net banking
     */
    getSupportedBanks() {
        return [
            { code: 'HDFC', name: 'HDFC Bank', logo: null },
            { code: 'ICICI', name: 'ICICI Bank', logo: null },
            { code: 'SBI', name: 'State Bank of India', logo: null },
            { code: 'AXIS', name: 'Axis Bank', logo: null },
            { code: 'KOTAK', name: 'Kotak Mahindra Bank', logo: null },
            { code: 'PNB', name: 'Punjab National Bank', logo: null },
            { code: 'BOB', name: 'Bank of Baroda', logo: null },
            { code: 'CANARA', name: 'Canara Bank', logo: null },
        ];
    }

    /**
     * Get supported wallets
     */
    getSupportedWallets() {
        return [
            { id: 'paytm', name: 'Paytm', logo: null },
            { id: 'phonepe', name: 'PhonePe', logo: null },
            { id: 'googlepay', name: 'Google Pay', logo: null },
            { id: 'amazonpay', name: 'Amazon Pay', logo: null },
        ];
    }
}

export const paymentService = new PaymentService();
export default paymentService;
