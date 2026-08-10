export const mockInvoices = [
  {
    id: "INV-2026-001",
    invoiceNo: "SCOMS/26-27/0042",
    institution: "ABC Matriculation Higher Secondary School",
    gstin: "33ABCDE1234F1Z5",
    sacCode: "998313",
    plan: "Enterprise Subscription (1 Year)",
    baseAmount: 249990,
    cgst: 22499.10,
    sgst: 22499.10,
    igst: 0,
    totalAmount: 294988.20,
    paymentMode: "Razorpay (UPI / Cards)",
    status: "Paid",
    invoiceDate: "2026-02-15",
    dueDate: "2026-02-28"
  },
  {
    id: "INV-2026-002",
    invoiceNo: "SCOMS/26-27/0043",
    institution: "Sri Lakshmi Arts and Science College",
    gstin: "29AAACL9988K1Z2",
    sacCode: "998313",
    plan: "Professional Subscription (1 Year)",
    baseAmount: 129990,
    cgst: 0,
    sgst: 0,
    igst: 23398.20,
    totalAmount: 153388.20,
    paymentMode: "Net Banking (SBI)",
    status: "Paid",
    invoiceDate: "2026-04-10",
    dueDate: "2026-04-25"
  },
  {
    id: "INV-2026-003",
    invoiceNo: "SCOMS/26-27/0044",
    institution: "SRS College of Engineering & Tech",
    gstin: "33AAACS5544J1Z8",
    sacCode: "998313",
    plan: "Enterprise Subscription (1 Year)",
    baseAmount: 249990,
    cgst: 22499.10,
    sgst: 22499.10,
    igst: 0,
    totalAmount: 294988.20,
    paymentMode: "Bank Wire Transfer",
    status: "Paid",
    invoiceDate: "2025-11-20",
    dueDate: "2025-12-05"
  }
];

export const mockBillingStats = {
  totalRevenue: 2845000,
  mrr: 485000,
  pendingPayments: 153388,
  failedPaymentsCount: 2
};
