import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Barcode, 
  Camera, 
  CameraOff, 
  PackageCheck, 
  Drill, 
  Search, 
  XCircle, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Asset, InventoryItem } from "@shared/schema";

// Mock interface for what might come from a real barcode scanner library
interface ScanResult {
  barcode: string;
  type: string;
  raw: string;
}

export default function BarcodeScanner() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scannedItem, setScannedItem] = useState<{ type: string; item: Asset | InventoryItem } | null>(null);
  const [isResultShowing, setIsResultShowing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scanBarcodeMutation = useMutation({
    mutationFn: async (barcode: string) => {
      return apiRequest("POST", "/api/scan", { barcode })
        .then(res => res.json());
    },
    onSuccess: (data) => {
      setScannedItem(data);
      setIsResultShowing(true);
      stopScanner();
      toast({
        title: "Item Found",
        description: `Found ${data.type}: ${data.item.description || data.item.name}`,
      });
    },
    onError: (error) => {
      setIsResultShowing(true);
      setScannedItem(null);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: error.message || "No item found with this barcode",
      });
    }
  });

  // Start the scanner
  const startScanner = async () => {
    try {
      // For a real implementation, we would use a barcode scanning library
      // that would access the camera and process video frames
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
      });
    }
  };

  // Stop the scanner
  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle manual barcode submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter a barcode",
      });
      return;
    }
    
    scanBarcodeMutation.mutate(manualInput);
  };

  // Create a mock "scanner" function for demo purposes
  // In a real app, this would be handled by a barcode scanning library
  useEffect(() => {
    if (isScanning) {
      // For demo, we'll simulate a barcode scan after 3 seconds
      const scanTimeout = setTimeout(() => {
        // This is just a simulation - in a real app, the scanner would detect actual barcodes
        const mockScanResult: ScanResult = {
          barcode: "DEMO-12345",
          type: "QR_CODE",
          raw: "DEMO-12345"
        };
        
        setScanResult(mockScanResult);
        scanBarcodeMutation.mutate(mockScanResult.barcode);
      }, 3000);
      
      return () => clearTimeout(scanTimeout);
    }
  }, [isScanning]);

  // Clean up camera when component unmounts
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const resetScanner = () => {
    setIsResultShowing(false);
    setScannedItem(null);
    setScanResult(null);
    setManualInput("");
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Barcode className="mr-2 h-5 w-5" />
            Barcode Scanner
          </CardTitle>
          <CardDescription>
            Scan asset or inventory barcodes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isResultShowing ? (
            // Show scan results
            <div className="space-y-4">
              {scannedItem ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Item Found</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Successfully scanned {scannedItem.type}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Not Found</AlertTitle>
                  <AlertDescription>
                    No item found with barcode: {scanResult?.barcode || manualInput}
                  </AlertDescription>
                </Alert>
              )}

              {scannedItem && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      {scannedItem.type === 'asset' ? (
                        <Drill className="mr-2 h-4 w-4 text-primary" />
                      ) : (
                        <PackageCheck className="mr-2 h-4 w-4 text-primary" />
                      )}
                      <CardTitle className="text-base">
                        {scannedItem.type === 'asset' ? 'Asset' : 'Inventory Item'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          {scannedItem.type === 'asset' ? 'Asset Number:' : 'Part Number:'}
                        </span>
                        <span className="text-sm font-medium">
                          {scannedItem.type === 'asset' 
                            ? (scannedItem.item as Asset).assetNumber 
                            : (scannedItem.item as InventoryItem).partNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          {scannedItem.type === 'asset' ? 'Description:' : 'Name:'}
                        </span>
                        <span className="text-sm font-medium">
                          {scannedItem.type === 'asset' 
                            ? (scannedItem.item as Asset).description 
                            : (scannedItem.item as InventoryItem).name}
                        </span>
                      </div>
                      {scannedItem.type === 'inventory' && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Quantity In Stock:</span>
                          <span className="text-sm font-medium">
                            {(scannedItem.item as InventoryItem).quantityInStock || 0}
                          </span>
                        </div>
                      )}
                      {scannedItem.type === 'asset' && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <span className="text-sm font-medium capitalize">
                            {(scannedItem.item as Asset).status.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              )}

              <Button 
                className="w-full" 
                variant="outline" 
                onClick={resetScanner}
              >
                Scan Another
              </Button>
            </div>
          ) : (
            // Show scanner interface
            <>
              <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                {isScanning ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Barcode className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Camera preview will appear here</p>
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 border-2 border-dashed border-primary/50 m-8 pointer-events-none" />
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={isScanning ? stopScanner : startScanner}
                  variant={isScanning ? "destructive" : "default"}
                  className="flex-1"
                >
                  {isScanning ? (
                    <>
                      <CameraOff className="mr-2 h-4 w-4" />
                      Stop Scanner
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Start Scanner
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                  </span>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="flex space-x-2">
                <Input
                  placeholder="Enter barcode"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
