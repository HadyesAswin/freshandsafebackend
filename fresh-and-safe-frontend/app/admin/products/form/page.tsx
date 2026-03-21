"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  X, 
  PackagePlus, 
  Image as ImageIcon, 
  IndianRupee, 
  Tag, 
  Layers,
  Info,
  Loader2,
  Type,
  Search
} from "lucide-react";

// ---------- Helper ----------
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

function ProductFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [price, setPrice] = useState<number | "">("");
  const [comparePrice, setComparePrice] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  
  // ✅ MULTIPLE IMAGES STATE
  const [images, setImages] = useState<File[]>([]);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  
  const [status, setStatus] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Load categories
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/v1/categories/")
      .then((res) => setCategories(res.data));
  }, []);

  // Load product if editing
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/products/")
      .then((res) => {
        const product = res.data.find((p: any) => p.id === Number(id));
        if (product) {
          setCategoryId(product.category_id);
          setName(product.name);
          setSlug(product.slug);
          setPrice(product.price);
          setComparePrice(product.compare_price || "");
          setUnit(product.unit || "");
          setDescription(product.description || "");
          setMetaTitle(product.meta_title || "");
          setMetaDescription(product.meta_description || "");
          setStatus(product.status);
          setIsAvailable(product.is_available);
          
          // ✅ Load existing multiple images safely
          if (product.images && product.images.length > 0) {
            setCurrentImages(product.images);
          } else if (product.image) {
            setCurrentImages([product.image]); // Fallback for old single-image products
          }
        }
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(""); // Clear old messages
    const token = localStorage.getItem("admin_token");

    const data = new FormData();
    data.append("category_id", String(categoryId));
    data.append("name", name);
    data.append("slug", slug);
    data.append("price", String(price));
    if (comparePrice !== "") data.append("compare_price", String(comparePrice));
    data.append("unit", unit);
    data.append("description", description);
    if (metaTitle) data.append("meta_title", metaTitle);
    if (metaDescription) data.append("meta_description", metaDescription);
    data.append("status", String(status));
    data.append("is_available", String(isAvailable));
    
    // ✅ Append multiple images
    images.forEach(img => {
      data.append("images", img);
    });
    // Send array of URLs that the user kept (didn't delete)
    data.append("existing_images", JSON.stringify(currentImages));

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/products/${id}`
          : "http://localhost:8000/api/v1/products/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/admin/products");
    } catch (err: any) {
      // ✅ BUGFIX: Safely handle FastAPI's 422 array of objects
      const detail = err.response?.data?.detail;
      
      if (Array.isArray(detail)) {
        // Map through the array and extract the specific field that failed
        const errorMessages = detail.map((d: any) => {
          const field = d.loc[d.loc.length - 1]; // e.g. "price" or "category_id"
          return `${field}: ${d.msg}`;
        });
        setMessage(`Validation Error: ${errorMessages.join(" | ")}`);
      } else if (typeof detail === "string") {
        // If it's a standard string error
        setMessage(detail);
      } else {
        setMessage("An unexpected error occurred. Please check your inputs.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-sm text-gray-500 mt-1">Configure your product details, pricing, and stock status.</p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium flex items-start gap-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
          <div>{message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
          
          {/* Section: Basic Details */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-50 pb-2">
              <Tag className="w-4 h-4 text-red-500" />
              <h2>Product Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setName(value);
                    if (!slugTouched) setSlug(generateSlug(value));
                  }}
                  className={inputClass}
                  placeholder="e.g. Fresh Organic Banana"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className={inputClass}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  className={`${inputClass} font-mono bg-gray-100/50`}
                  placeholder="slug-format-name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Pricing & Inventory */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-50 pb-2">
              <IndianRupee className="w-4 h-4 text-red-500" />
              <h2>Pricing & Inventory</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>Price (₹)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={inputClass}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Compare Price (₹)</label>
                <input
                  type="number"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.valueAsNumber || "")}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className={labelClass}>Weight / Unit Size</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 500g, 1kg, 1 pc"
                />
                <div className="mt-2 text-[11px] font-medium text-gray-500 h-4">
                  {(price || unit) ? (
                    <>Display preview: <span className="text-gray-900 font-bold px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">₹{price || "0"} {unit ? `/ ${unit}` : ''}</span></>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Media & Info */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-50 pb-2">
              <Layers className="w-4 h-4 text-red-500" />
              <h2>Media & Description</h2>
            </div>
            <div className="space-y-6">
              
              <div>
                <label className={labelClass}>Product Images</label>
                
                {(currentImages.length > 0 || images.length > 0) && (
                  <div className="flex flex-wrap gap-4 mb-4">
                    {/* Existing Images */}
                    {currentImages.map((url, idx) => (
                      <div key={`curr-${idx}`} className="relative group w-24 h-24">
                        <img 
                          src={`http://localhost:8000${url}`} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm bg-white" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setCurrentImages(prev => prev.filter((_, i) => i !== idx))} 
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Newly Uploaded Images */}
                    {images.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative group w-24 h-24">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded-lg border border-green-300 shadow-sm bg-white" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} 
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label className="relative cursor-pointer rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none">
                        <span>Upload Images</span>
                        <input 
                          type="file" 
                          multiple
                          className="sr-only" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              setImages(prev => [...prev, ...Array.from(e.target.files!)]);
                            }
                          }}
                          required={!isEdit && currentImages.length === 0 && images.length === 0} 
                        />
                      </label>
                      <p className="pl-1 text-gray-500">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">PNG, JPG up to 5MB (Multiple allowed)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} min-h-[120px] resize-y`}
                  placeholder="Write something about this product..."
                />
              </div>
            </div>
          </div>

          {/* Section: SEO Information */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-50 pb-2 pt-6">
              <Search className="w-4 h-4 text-red-500" />
              <h2>SEO Information (Optional)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Buy Fresh Organic Bananas Online | Fresh&Safe"
                />
                <p className="text-[10px] text-gray-400 mt-1 font-medium">Leave blank to use the default product name.</p>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className={`${inputClass} min-h-[80px] resize-y`}
                  placeholder="Brief summary for Google search results..."
                />
              </div>
            </div>
          </div>

          {/* Section: Status Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} className="peer sr-only" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </div>
              <div className="ml-3">
                <span className="block text-sm font-semibold text-gray-900">Active</span>
                <span className="block text-xs text-gray-500">Visible on the website</span>
              </div>
            </label>

            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="peer sr-only" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </div>
              <div className="ml-3">
                <span className="block text-sm font-semibold text-gray-900">In Stock</span>
                <span className="block text-xs text-gray-500">Available for customer orders</span>
              </div>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
            {isEdit ? "Update Product" : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProductFormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-red-600" />
        Loading product form...
      </div>
    }>
      <ProductFormContent />
    </Suspense>
  );
}