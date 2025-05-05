import BarcodeScanner from "@/components/scanner/BarcodeScanner";

export default function Scanner() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight mb-6">Barcode Scanner</h2>
      <BarcodeScanner />
    </div>
  );
}
