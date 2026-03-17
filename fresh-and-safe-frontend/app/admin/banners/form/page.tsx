"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css"; // Required CSS for the crop grid
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Hash, 
  Link as LinkIcon, 
  Save, 
  Info, 
  Layout, 
  Crop as CropIcon,
  Check,
  AlertTriangle
} from "lucide-react";

// --- Helper: Generate actual File from the cropped canvas ---
function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<{file: File, url: string}> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return Promise.reject(new Error("No 2d context"));
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      const file = new File([blob], fileName, { type: "image/jpeg" });
      resolve({ file, url: URL.createObjectURL(blob) });
    }, "image/jpeg", 0.95);
  });
}

function BannerFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = Boolean(id);

  // Form States
  const [displayOrder, setDisplayOrder] = useState(0);
  const [url, setUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  // Live Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- Interactive Cropping States ---
  const [imgSrc, setImgSrc] = useState(""); // Raw base64 image for the cropper
  const [isCropping, setIsCropping] = useState(false);
  const [imageError, setImageError] = useState(""); // Validation Error
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%", 
    x: 0,
    y: 0,
    width: 100,
    height: (100 / (1920 / 600)) // Force initial aspect ratio box
  });

  // Load data if editing
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/banners/")
      .then((res) => {
        const banner = res.data.find((b: any) => b.id === Number(id));
        if (banner) {
          setDisplayOrder(banner.display_order);
          setUrl(banner.url || "");
          if (banner.image) {
            setPreviewUrl(`http://localhost:8000${banner.image}`);
          }
        }
      });
  }, [id]);

  // 1. User selects a file -> Validate -> Load it into the Cropper tool
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(""); 
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // ✅ STRICT VALIDATION
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        // Must be horizontal (landscape) AND at least 1920x600
        if (img.width < 1920 || img.height < 600) {
          setImageError(`Image is too small (${img.width}x${img.height}px). It must be at least 1920x600px.`);
          URL.revokeObjectURL(objectUrl);
          return; // Stop execution, don't open cropper
        }
        
        if (img.height >= img.width) {
            setImageError(`Image is too tall/square. Please upload a wide horizontal banner.`);
            URL.revokeObjectURL(objectUrl);
            return; // Stop execution
        }

        // If it passes validation, proceed to crop mode
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          setImgSrc(reader.result?.toString() || "");
          setIsCropping(true); 
          setPreviewUrl(null); 
        });
        reader.readAsDataURL(file);
        URL.revokeObjectURL(objectUrl); // Clean up memory
      };
      
      img.src = objectUrl;
    }
  };

  // 2. User clicks "Apply Crop" -> Generate cropped file and URL
  const handleApplyCrop = async () => {
    if (imgRef.current && crop.width && crop.height) {
      try {
        const { file, url } = await getCroppedImg(imgRef.current, crop, "banner-cropped.jpg");
        setImage(file);
        setPreviewUrl(url);
        setIsCropping(false); // Exit crop mode
      } catch (e) {
        console.error("Failed to crop image", e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");

    const data = new FormData();
    data.append("display_order", String(displayOrder));
    data.append("url", url);
    if (image) data.append("image", image);

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/banners/${id}`
          : "http://localhost:8000/api/v1/banners/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/admin/banners");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Action failed");
    }
  };

  // Standardized styling classes
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layout className="w-6 h-6 text-red-600" />
            {isEdit ? "Edit Banner" : "Add New Banner"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? "Update the visual display and link for this promotion." : "Upload a new marketing banner for your storefront."}
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 animate-pulse">
          <Info className="w-4 h-4" /> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Banner Media Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Banner Image</label>
             {previewUrl && !isCropping && (
               <label className="cursor-pointer text-xs font-bold text-red-600 hover:underline">
                 Change Image
                 <input type="file" className="sr-only" accept="image/*" onChange={handleFileSelect} />
               </label>
             )}
          </div>

          {/* STATE 1: Upload Box (Only show if no image is being cropped or previewed) */}
          {!isCropping && !previewUrl && (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors relative group">
              <div className="space-y-1 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-300 group-hover:text-red-300 transition-colors" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label className="relative cursor-pointer rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none">
                    <span>Select an image to crop</span>
                    <input 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      onChange={handleFileSelect}
                      required={!isEdit} 
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400 font-medium">Must be wide and at least 1920x600px.</p>
              </div>
            </div>
          )}
          
          {/* ✅ Validation Error Message */}
          {imageError && (
             <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{imageError}</span>
             </div>
          )}

          {/* STATE 2: Interactive Cropping Tool */}
          {isCropping && imgSrc && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col items-center mt-3">
              <div className="w-full flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <CropIcon className="w-4 h-4 text-blue-600" /> Adjust Grid
                 </div>
                 <button 
                   type="button" 
                   onClick={handleApplyCrop} 
                   className="flex items-center gap-1 bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                 >
                   <Check className="w-4 h-4" /> Apply Crop
                 </button>
              </div>

              <div className="max-h-[500px] overflow-hidden rounded-lg shadow-inner bg-black/5 flex items-center justify-center">
                <ReactCrop 
                  crop={crop} 
                  onChange={(c) => setCrop(c)} 
                  aspect={1920 / 600} // Locks the grid strictly to your frontend banner ratio
                  className="max-h-[500px]"
                >
                  <img 
                    ref={imgRef} 
                    src={imgSrc} 
                    alt="Upload Preview" 
                    className="max-h-[500px] w-auto object-contain"
                  />
                </ReactCrop>
              </div>
              <p className="text-xs text-gray-500 mt-3">Drag the edges of the grid to frame your banner perfectly.</p>
            </div>
          )}
        </div>

        {/* STATE 3: Live Frontend Preview Block (Shows after cropping is done) */}
        {previewUrl && !isCropping && (
          <div className="pt-2 animate-in fade-in duration-500">
            <label className={`${labelClass} flex items-center gap-2 mb-3`}>
              <Layout className="w-3.5 h-3.5 text-green-600" /> Frontend Live Preview
            </label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl relative">
              
              {/* Exact classes matching your frontend slider container */}
              <div className="relative w-full h-[200px] md:h-[400px] rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-slate-200 shadow-inner">
                <img
                  src={previewUrl}
                  alt="Banner Live Preview"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
          </div>
        )}

        {/* Banner Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <Hash className="w-3.5 h-3.5" /> Display Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className={inputClass}
              placeholder="e.g. 1"
            />
          </div>
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <LinkIcon className="w-3.5 h-3.5" /> Redirect URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
              placeholder="e.g. /user/categories/fruits"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isCropping}
            className="flex items-center gap-2 px-8 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isEdit ? "Update Banner" : "Save Banner"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BannerFormPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <BannerFormContent />
    </Suspense>
  );
}