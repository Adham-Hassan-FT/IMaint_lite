import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, Trash, Download, File } from "lucide-react";
import { format } from "date-fns";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetId?: number;
  workOrderId?: number;
}

type Document = {
  id: number;
  filename: string;
  filesize: number;
  uploadDate: string;
  contentType: string;
  entityId: number;
  entityType: string;
};

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  assetId,
  workOrderId,
}: DocumentUploadModalProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const entityType = assetId ? "asset" : workOrderId ? "workorder" : null;
  const entityId = assetId || workOrderId;

  // Query to fetch existing documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: [`/api/documents/${entityType}/${entityId}`],
    enabled: !!entityType && !!entityId && isOpen,
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/documents/${entityType}/${entityId}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload document");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entityId}`] });
      toast({
        title: "Document Uploaded",
        description: "The document was uploaded successfully",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadProgress(0);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "An unexpected error occurred during upload",
      });
      setUploadProgress(0);
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return await apiRequest("DELETE", `/api/documents/${documentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entityId}`] });
      toast({
        title: "Document Deleted",
        description: "The document was deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setUploadProgress(10);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.floor(Math.random() * 10);
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 300);

    try {
      await uploadMutation.mutateAsync(formData);
      setUploadProgress(100);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = (documentId: number) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(documentId);
    }
  };

  const handleDownloadDocument = (document: Document) => {
    window.open(`/api/documents/${document.id}/download`, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Management</DialogTitle>
          <DialogDescription>
            Upload and manage documents for this {entityType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="document">Upload New Document</Label>
            <div className="flex mt-2">
              <Input
                id="document"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="ml-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {isUploading && (
              <div className="mt-2">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-in-out" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </h3>
            
            {isLoading ? (
              <div className="flex justify-center mt-4">
                <p>Loading documents...</p>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-2 mt-2">
                {documents.map((doc) => (
                  <Card key={doc.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <File className="h-5 w-5 mr-3 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.filename}</p>
                            <div className="flex text-xs text-muted-foreground mt-1">
                              <span>{formatFileSize(doc.filesize)}</span>
                              <span className="mx-2">•</span>
                              <span>
                                {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted rounded-md mt-2">
                <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}