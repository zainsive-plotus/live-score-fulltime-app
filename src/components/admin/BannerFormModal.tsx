// src/components/admin/BannerFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { IBanner } from "@/models/Banner";
import { AD_SLOTS } from "@/config/adSlots";
import { X, UploadCloud, XCircle } from "lucide-react";

// ... interface and type definitions remain the same ...
interface BannerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner: Partial<IBanner> | null;
}
type FormData = {
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  location: string;
};

export default function BannerFormModal({
  isOpen,
  onClose,
  banner,
}: BannerFormModalProps) {
  // ... all existing state and useEffect hooks remain the same ...
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    imageUrl: "",
    linkUrl: "",
    isActive: true,
    location: AD_SLOTS[0]?.id || "",
  });
  const [isUploading, setIsUploading] = useState(false);
  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || "",
        imageUrl: banner.imageUrl || "",
        linkUrl: banner.linkUrl || "",
        isActive: banner.isActive !== undefined ? banner.isActive : true,
        location: banner.location || AD_SLOTS[0]?.id || "",
      });
    } else {
      setFormData({
        title: "",
        imageUrl: "",
        linkUrl: "",
        isActive: true,
        location: AD_SLOTS[0]?.id || "",
      });
    }
    setIsUploading(false);
  }, [banner, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    // --- THE FIX IS HERE ---
    // Add the uploadType to the form data to tell the server how to process this image.
    uploadFormData.append("uploadType", "banner");

    try {
      const { data } = await axios.post("/api/upload", uploadFormData);
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // ... the mutation and handleSubmit functions remain the same ...
  const mutation = useMutation({
    mutationFn: (newBanner: FormData) => {
      if (banner?._id) {
        return axios.put(`/api/banners/${banner._id}`, newBanner);
      }
      return axios.post("/api/banners", newBanner);
    },
    onSuccess: () => {
      toast.success(
        `Banner ${banner?._id ? "updated" : "created"} successfully!`
      );
      queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "An error occurred.");
    },
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.imageUrl ||
      !formData.linkUrl ||
      !formData.location
    ) {
      toast.error("All fields, including an uploaded image, are required.");
      return;
    }
    mutation.mutate(formData);
  };

  // ... the entire return JSX remains the same ...
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg p-6 md:p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-muted hover:text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">
          {banner?._id ? "Edit Banner" : "Create New Banner"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-brand-light mb-2">
              Banner Image
            </label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 px-6 py-10">
              {formData.imageUrl ? (
                <div className="relative group w-full h-48">
                  <Image
                    src={formData.imageUrl}
                    alt="Banner preview"
                    layout="fill"
                    objectFit="contain"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, imageUrl: "" }))
                    }
                    className="absolute top-2 right-2 bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-400">
                    <label
                      htmlFor="banner-image-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-brand-purple focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-purple focus-within:ring-offset-2 focus-within:ring-offset-brand-dark hover:text-brand-purple/80"
                    >
                      <span>
                        {isUploading ? "Uploading..." : "Upload an image"}
                      </span>
                      <input
                        id="banner-image-upload"
                        name="banner-image-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-500">
                    PNG, JPG, GIF up to 10MB. Will be converted to WebP.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label
              htmlFor="linkUrl"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Link URL (Destination)
            </label>
            <input
              id="linkUrl"
              type="url"
              value={formData.linkUrl}
              onChange={(e) =>
                setFormData({ ...formData, linkUrl: e.target.value })
              }
              required
              placeholder="https://destination.com"
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Location
            </label>
            <select
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-2.5 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              {AD_SLOTS.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-brand-muted mt-1">
              {AD_SLOTS.find((s) => s.id === formData.location)?.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-brand-light"
            >
              Active (Visible on site)
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || isUploading}
              className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading
                ? "Uploading..."
                : mutation.isPending
                ? "Saving..."
                : "Save Banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
