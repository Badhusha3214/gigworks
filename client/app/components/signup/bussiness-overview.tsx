"use client";

import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@nextui-org/input";
import type { FormData } from "../../signup/page";
import {
  fetchBusinessData,
  fetchsubCategoryByCategory,
  checkSlug,
  fetchDataBySubCategory
} from "../../api/index";

interface BusinessOverviewProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
}

export default function BusinessOverview({
  formData,
  updateFormData,
  onNext,
}: BusinessOverviewProps) {
  const [slugFocused, setSlugFocused] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  // Debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced slug check function
  const debouncedSlugCheck = useCallback(
    debounce(async (slug: string) => {
      if (slug.length < 3) {
        setSlugError("Slug must be at least 3 characters long");
        setSlugAvailable(null);
        return;
      }

      setIsCheckingSlug(true);
      try {
        const response = await checkSlug(slug);
        console.log("response slug", response);

        setSlugAvailable(response.data);
        setSlugError(response.data ? null : "This slug is already taken");
      } catch (error) {
        setSlugError("Error checking slug availability");
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500),
    []
  );

  console.log("form data anu",formData);
  

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;

    if (name === "slug") {
      const slugValue = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      updateFormData({ [name]: slugValue });

      // Only check if slug is valid length
      if (slugValue.length >= 3) {
        debouncedSlugCheck(slugValue);
      }
    } else {
      updateFormData({
        [name]: files ? files[0] : value,
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchBusinessData();
        setCategories(data.data.categories); // Adjust according to the structure of your data
        console.log(data.data.categories);
      } catch (error) {
        console.error("Error fetching business categories:", error);
      }
    };
    fetchData();
  }, []);

  const handleCategoryChange = async (event: any) => {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);

    try {
      const data = await fetchsubCategoryByCategory(categoryId);
      setSubCategories(data.data.subCategory); // Adjust according to the structure of your data
      console.log(data.data.subCategory);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const handleSubCategoryChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const subCategoryId = event.target.value;
    setSelectedSubCategory(subCategoryId);

    try {
      const data = await fetchDataBySubCategory(subCategoryId);
      // Handle the fetched data as needed
      setSubCategoryOptions(data.data.subCategoryOption);
      console.log("data aney",data.data.subCategoryOption);
    } catch (error) {
      console.error("Error fetching data by subcategory:", error);
    }
  };

  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold py-4">Business Overview</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* First Row */}
          <div>
            <label className="block text-base font-bold pb-2 text-gray-700">
              Business Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              placeholder="Eg : Super Maerk"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold pb-2 text-gray-700">
              Business Category<span className="text-red-500">*</span>
            </label>
            <select
              name="businessCategory"
              value={formData.businessCategory = selectedCategory} 
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
              <label className="block text-base font-bold pb-2 text-gray-700">
                SubCategory<span className="text-red-500">*</span>
              </label>
              <select
                name="subCategory"
                value={selectedSubCategory}
                onChange={handleSubCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="">Select SubCategory</option>
                {subCategories.map((subCategory: any) => (
                  <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
                ))}
              </select>
            </div>
          {/* Second Row */}
          <div>
            <label className="block text-base font-bold pb-2 text-gray-700">
              Sub Category Options<span className="text-red-500">*</span>
            </label>
            <select
              name="subCategoryOptions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="">Select Sub Category</option>
              {subCategoryOptions.map((option: any) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-bold pb-2 text-gray-700">
              Owner&apos;s/Manager&apos;s Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleInputChange}
              placeholder="Eg : John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold pb-2 text-gray-700">
              WhatsApp Number<span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="whatsAppNumber"
              value={formData.whatsAppNumber}
              onChange={handleInputChange}
              placeholder="WhatsApp Number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          {/* Third Row */}
          <div>
            <label className="block text-base font-bold pb-2 text-gray-700">
              Email Address<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="emailAddress"
              value={formData.emailAddress}
              onChange={handleInputChange}
              placeholder="Eg : supermaerk@gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold pb-2 text-gray-700">
              Business Type<span className="text-red-500">*</span>
            </label>
            <select
              name="businessType"
              value={formData.businessType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            >
              <option value="">Business Type</option>
              <option value="online">Online</option>
              <option value="Offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-bold text-gray-700">
              Slug<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="slug"
                placeholder="Eg: super-maerk"
                className={`w-full px-3 py-2 border ${
                  slugError
                    ? "border-red-500"
                    : slugAvailable
                    ? "border-green-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500`}
                required
                onChange={handleInputChange}
                value={formData.slug}
                onFocus={() => setSlugFocused(true)}
                onBlur={() => setSlugFocused(false)}
                
              />
              {isCheckingSlug && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                </div>
              )}
              {!isCheckingSlug && slugAvailable && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                  ✓
                </div>
              )}
            </div>
            {slugError && <p className="text-red-500 text-sm">{slugError}</p>}
            <div
              className={`text-sm space-y-1 ${
                slugFocused ? "block" : "hidden"
              }`}
            >
              {slugAvailable && (
              <p className="text-gray-600">
                This will be your unique business URL: gigwork.co.in/
                <span className="font-medium">
                  {formData.slug || "your-slug"}
                </span>
              </p>
              )}
              <ul className="text-gray-500 space-y-1 pl-4">
                <li>• Use only letters, numbers, and hyphens</li>
                <li>• Must be between 3-60 characters</li>
                <li>• Cannot start or end with a hyphen</li>
                <li>• Will be converted to lowercase</li>
              </ul>
            </div>
          </div>

          {/* Business Description */}
          <div className="col-span-full">
            <label className="block text-base font-bold pb-2 text-gray-700">
              Business Description
            </label>
            <Textarea
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleInputChange}
              placeholder="Business Description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 h-24"
              required
            />
          </div>

          {/* Media & Branding Section */}
          <div className="col-span-full">
            <h1 className="text-2xl font-bold py-1">Media & Branding</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold pb-2 text-gray-700">
                  Upload Profile<span className="text-red-500">*</span>
                </label>
                <div className="relative border-2 bg-gray-200 rounded-lg hover:border-gray-500 transition h-20">
                  <input
                    type="file"
                    name="profileImage"
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-gray-600">
                      Drag and drop or click to upload
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-base font-bold pb-2 text-gray-700">
                  Upload Cover
                </label>
                <div className="relative border-2 bg-gray-200 rounded-lg hover:border-gray-500 transition h-20">
                  <input
                    type="file"
                    name="coverImage"
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-gray-600">
                      Drag and drop or click to upload
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="w-full md:w-40 bg-[#303030] text-white font-bold px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      </form>
    </div>
  );
}
