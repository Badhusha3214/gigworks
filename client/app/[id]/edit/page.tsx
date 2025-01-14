"use client";

import React, { useState, useEffect } from "react";
import {
  fetchBusinessesByslug,
  ASSET_BASE_URL,
  updateBusiness,
  GetURL,
  uploadToPresignedUrl,
  createBusinessMedia,
} from "@/app/api";
import { useParams, useRouter } from "next/navigation";
import {
  Pencil,
  Save,
  X,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
} from "lucide-react";
import ImageGrid from "@/app/components/imgsec";
import ImageUploadButton from "@/app/components/ImageUploadButton";
import MediaGallery from "@/app/components/MediaGallery";
import OperatingHours from "@/app/components/OperatingHours";
import { deletebusinessMedia } from "@/app/api";
import { toast } from "react-hot-toast"; // Add toast for notifications
import { s } from "framer-motion/client";
import ImageCropper from "@/app/components/ImageCropper";

// Add License interface before other interfaces
interface License {
  name: string;
  number: string;
  url: string;
  description: string;
}

// Add MediaItem interface
interface MediaItem {
  id: string;
  url: string;
  type: string;
}

interface BusinessProfile {
  _id: string;
  name: string;
  description: string;
  email: string;
  phone: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  operating_hours: {
    [key: string]: string;
  };
  socials: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    [key: string]: string | undefined; // Add index signature for socials
  };
  avatar: string;
  banner: string;
  type: string;
  additional_services: string;
  gstin: string;
  id: string; // Add this field
  [key: string]: any; // Add index signature to allow dynamic access
}

interface BusinessData {
  profile: BusinessProfile;
  user: {
    name: string;
    phone: string;
  };
  _id: string;
  media: MediaItem[]; // Add this field
  category: string;
  subCategory: string;
  subCategoryOption: string;
  licenses: License[]; // Now License is defined
  tags: string[];
}

export const runtime = "edge";

// Add this social media config object near the top of your component

const socialMediaConfig = {
  website: { label: "Website URL", icon: "/icon/globe.svg" },
  facebook: { label: "Facebook Profile", icon: "/icon/facebook.svg" },
  instagram: { label: "Instagram Profile", icon: "/icon/instagram.svg" },
  twitter: { label: "Twitter Profile", icon: "/icon/twitter.svg" },
  linkedin: { label: "LinkedIn Profile", icon: "/icon/linkedin.svg" },
  youtube: { label: "YouTube Channel", icon: "/icon/youtube.svg" },
  reddit: { label: "Reddit Profile", icon: "/icon/reddit.svg" },
  tiktok: { label: "TikTok Profile", icon: "/icon/tiktok.svg" },
  pinterest: { label: "Pinterest Profile", icon: "/icon/pinterest.svg" },
  behance: { label: "Behance Profile", icon: "/icon/behance.svg" },
  dribbble: { label: "Dribbble Profile", icon: "/icon/dribbble.svg" },
  github: { label: "GitHub Profile", icon: "/icon/github.svg" },
  medium: { label: "Medium Profile", icon: "/icon/medium.svg" },
};
export default function EditBusinessPage() {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<Partial<BusinessProfile>>({});
  const params = useParams();
  const router = useRouter();

  // Move fetchData outside useEffect so it can be referenced anywhere in the component
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetchBusinessesByslug(params.id as string);
      if (response.message === "Business fetched successfully") {
        setBusinessData(response.data);
      } else {
        setError("Failed to load business data");
      }
    } catch (err) {
      setError("Failed to load business data");
    } finally {
      setIsLoading(false);
    }
  };

  // Check authorization
  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      router.push(`/${params.id}`);
    }
  }, [params.id, router]);

  // Initial data fetch
  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleFieldSave = async (field: string, value: any) => {
    try {
      if (!businessData?.profile.id) return;

      const fieldParts = field.split(".");
      let updateData: Record<string, any> = {};

      if (fieldParts.length > 1 && fieldParts[0] === "socials") {
        // Handle social media fields specifically
        updateData.socials = {
          ...(businessData.profile.socials || {}),
          [fieldParts[1]]: value,
        };
      } else {
        // Handle regular fields
        updateData[field] = value;
      }

      // Ensure updateData is not empty before making the API call
      if (Object.keys(updateData).length === 0) {
        console.warn("No values to update");
        return;
      }

      // Log the updateData object
      console.log("Updating business with data:", updateData);

      await updateBusiness(businessData.profile.id, updateData);
      toast.success(`${field} updated successfully`);

      // Update local state
      setBusinessData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            ...(fieldParts[0] === "socials"
              ? {
                  socials: {
                    ...prev.profile.socials,
                    [fieldParts[1]]: value,
                  },
                }
              : updateData),
          },
        };
      });
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error(`Failed to update ${field}`);
    }
  };

  const handleImageUpload = (assetpath: string, field: "avatar" | "banner") => {
    console.log("Image uploaded:", assetpath);
    // console.log('Field:', field);
    handleFieldSave(field, assetpath);
  };

  // Replace handleChange with immediate save
  const handleChange = async (field: string, value: string) => {
    await handleFieldSave(field, value);
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save all changes
      router.push(`/${params.id}`);
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  const handleMediaDelete = async (mediaId: string) => {
    try {
      if (businessData?.profile.id) {
        await deletebusinessMedia(businessData.profile.id, mediaId);
      }
      fetchData();
      toast.success("Media item deleted successfully");
    } catch (error) {
      console.error("Error deleting media:", error);
      toast.error("Failed to delete media item");
    }
  };

  const handleOperatingHoursUpdate = async (newHours: {
    [key: string]: string;
  }) => {
    try {
      if (!businessData?.profile.id) return;

      await updateBusiness(businessData.profile.id, {
        operating_hours: newHours,
      });
      toast.success("Operating hours updated successfully");

      // Update local state
      setBusinessData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            operating_hours: newHours,
          },
        };
      });
    } catch (error) {
      console.error("Error updating operating hours:", error);
      toast.error("Failed to update operating hours");
    }
  };

  const [cropperState, setCropperState] = useState<{
    isOpen: boolean;
    imageUrl: string;
    fieldType: "avatar" | "banner" | null;
  }>({
    isOpen: false,
    imageUrl: "",
    fieldType: null,
  });

  const handleImageSelect = async (file: File, fieldType: "avatar" | "banner") => {
    const imageUrl = URL.createObjectURL(file);
    setCropperState({
      isOpen: true,
      imageUrl,
      fieldType,
    });
  };

  const handleCroppedImage = async (croppedImageUrl: string) => {
    try {
      if (!cropperState.fieldType || !businessData?.profile.id) return;

      // Convert base64/URL to blob
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });

      // Get presigned URL
      const uploadResponse = await GetURL({
        type: file.type,
        category: cropperState.fieldType,
      });

      if (!uploadResponse.presignedUrl) {
        throw new Error("Failed to get presigned URL");
      }

      // Upload to storage
      await uploadToPresignedUrl(uploadResponse.presignedUrl, file);

      // Update business profile
      await handleFieldSave(cropperState.fieldType, uploadResponse.assetpath);

      // Close cropper
      setCropperState({
        isOpen: false,
        imageUrl: "",
        fieldType: null,
      });

      toast.success("Image updated successfully");
    } catch (error) {
      console.error("Error handling cropped image:", error);
      toast.error("Failed to update image");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No data available
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex md:flex-row flex-col justify-between items-center mb-8">
          <h1 className="text-2xl font-bold md:pb-0 pb-2">
            Edit Business Profile
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/${params.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg"
            >
              <X size={20} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              <Save size={20} />
              Save All Changes
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Images */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Profile Images</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Avatar */}
              <div>
                <h3 className="text-sm font-medium mb-2">Profile Image</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file, "avatar");
                  }}
                  className="hidden"
                  id="avatar-input"
                />
                <div className="relative">
                  <img
                    src={
                      businessData.profile.avatar
                        ? `${ASSET_BASE_URL}/${businessData.profile.avatar}`
                        : "/placeholder-avatar.png"
                    }
                    alt="Avatar"
                    className="w-32 h-32 object-cover rounded-full"
                  />
                  <label
                    htmlFor="avatar-input"
                    className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow cursor-pointer"
                  >
                    <Pencil size={16} />
                  </label>
                </div>
              </div>
              {/* Banner Image */}
              <div>
                <h3 className="text-sm font-medium mb-2">Banner Image</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file, "banner");
                  }}
                  className="hidden"
                  id="banner-input"
                />
                <div className="relative">
                  <img
                    src={
                      businessData.profile.banner
                        ? `${ASSET_BASE_URL}/${businessData.profile.banner}`
                        : "/placeholder-banner.png"
                    }
                    alt="Banner"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <label
                    htmlFor="banner-input"
                    className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow cursor-pointer"
                  >
                    <Pencil size={16} />
                  </label>
                </div>
              </div>
            </div>
            {/* Image Cropper Modal */}
            {cropperState.isOpen && (
              <ImageCropper
                imageUrl={cropperState.imageUrl}
                aspect={cropperState.fieldType === "avatar" ? 1 : 16 / 9}
                onCropComplete={handleCroppedImage}
                onCancel={() =>
                  setCropperState({ isOpen: false, imageUrl: "", fieldType: null })
                }
              />
            )}
          </section>

          {/* Basic Information */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  defaultValue={businessData.profile.name}
                  onBlur={(e) => handleFieldSave("name", e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  defaultValue={businessData.profile.description}
                  onBlur={(e) => handleFieldSave("description", e.target.value)}
                  className="w-full p-2 border rounded-lg min-h-[100px]"
                />
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={businessData.profile.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="number"
                  defaultValue={businessData.user.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  defaultValue={businessData.profile.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* Add this new section after Contact Information and before Social Media Links */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Additional Services</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {businessData.profile.additional_services
                  .split(",")
                  .map((service, index) => {
                    const formattedService = service
                      .trim()
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim();

                    return (
                      <span
                        key={index}
                        className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {formattedService}
                      </span>
                    );
                  })}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Edit Services (comma-separated)
                </label>
                <input
                  type="text"
                  defaultValue={businessData.profile.additional_services}
                  onBlur={(e) =>
                    handleFieldSave("additional_services", e.target.value)
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., customOrders, afterSalesSupport"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter services separated by commas. Use camelCase for multiple
                  words (e.g., customOrders).
                </p>
              </div>
            </div>
          </section>

          {/* Social Media Links */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Social Media Links</h2>
            <div className="space-y-4">
              {Object.entries(socialMediaConfig).map(
                ([key, { label, icon }]) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                      <img src={icon} alt={label} className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        {label}
                      </label>
                      <input
                        type="url"
                        defaultValue={
                          businessData.profile.socials?.[
                            key as keyof typeof businessData.profile.socials
                          ] || ""
                        }
                        onBlur={(e) =>
                          handleFieldSave(`socials.${key}`, e.target.value)
                        }
                        className="w-full p-2 border rounded-lg"
                        placeholder={`Enter ${label}`}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Operating Hours */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Operating Hours</h2>
            <OperatingHours
              hours={businessData.profile.operating_hours}
              onUpdate={handleOperatingHoursUpdate}
            />
          </section>

          {/* Media Gallery */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Media Gallery</h2>
            <MediaGallery
              media={businessData.media}
              businessId={businessData.profile.id} // Changed from _id to profile.id
              onUpdate={() => fetchData()}
              onDelete={handleMediaDelete}
            />
          </section>

          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Business Operation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">GSTIN</h3>
                <p className="p-2 bg-gray-50 rounded-lg">
                  {businessData.profile.gstin || "Not provided"}
                </p>
              </div>
              {businessData.licenses.map((license, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-sm font-medium mb-1">
                    License {index + 1}
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <p>
                      <span className="font-medium">Name:</span> {license.name}
                    </p>
                    <p>
                      <span className="font-medium">Number:</span>{" "}
                      {license.number}
                    </p>
                    {license.url && (
                      <div>
                        <span className="font-medium">Certificate:</span>
                        <img
                          src={`${ASSET_BASE_URL}/${license.url}`}
                          alt={`License certificate for ${license.name}`}
                          className="mt-2 max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
