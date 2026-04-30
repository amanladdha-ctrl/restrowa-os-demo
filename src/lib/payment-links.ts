import QRCode from "qrcode";

type UpiInput = {
  payeeName: string;
  upiId: string;
  amount: number;
  orderCode: string;
};

function sanitize(text: string) {
  return text.trim();
}

export function buildUpiPaymentLink(input: UpiInput) {
  const params = new URLSearchParams({
    pa: sanitize(input.upiId),
    pn: sanitize(input.payeeName),
    am: input.amount.toFixed(2),
    cu: "INR",
    tn: `RestroWA order ${sanitize(input.orderCode)}`
  });

  return `upi://pay?${params.toString()}`;
}

export async function buildUpiQrDataUrl(input: UpiInput) {
  const paymentLink = buildUpiPaymentLink(input);
  return QRCode.toDataURL(paymentLink, {
    margin: 1,
    width: 320,
    color: {
      dark: "#1f2933",
      light: "#ffffff"
    }
  });
}
