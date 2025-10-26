import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import MarkdownEditor from "@/components/MarkdownEditor";
import { useAuth } from "@/hooks/useAuth";
import {
  getCategories,
  getTags,
  getWriteup,
  getWriteupContent,
  updateWriteup,
  updateWriteupContent,
  uploadImage,
} from "@/libs/api";

export const Route = createFileRoute("/writeups/$writeupId/edit")({
  component: EditWriteupPage,
  beforeLoad: async ({ context }) => {
    await context.auth.ensureLoaded();

    const user = context.auth.getUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }

    return {};
  },
});

function EditWriteupPage() {
  const { writeupId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    tagIds: [] as string[],
  });

  const [content, setContent] = useState("");
  const [originalAuthorId, setOriginalAuthorId] = useState("");

  // Fetch writeup data
  const { data: writeup, isLoading: isLoadingWriteup } = useQuery({
    queryKey: ["writeups", writeupId],
    queryFn: () => getWriteup(Number(writeupId)),
  });

  useEffect(() => {
    if (!writeup) return;
    setFormData({
      title: writeup.title,
      categoryId: String(writeup.category.id),
      tagIds: writeup.tags?.map((tag) => String(tag.id)) || [],
    });
    setOriginalAuthorId(writeup.createdByUser.id);
  }, [writeup]);

  // Fetch writeup content
  const { data: rawContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ["writeups", writeupId, "raw-content"],
    queryFn: () => getWriteupContent(Number(writeupId)),
  });

  useEffect(() => {
    if (rawContent == null) return;
    setContent(rawContent);
  }, [rawContent]);

  // Fetch necessary data
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  });

  // Check if user can edit this writeup
  useEffect(() => {
    if (user && originalAuthorId && user.id !== originalAuthorId && user.role !== "admin") {
      navigate({ to: `/writeups/$writeupId`, params: { writeupId } });
    }
  }, [user, originalAuthorId, writeupId, navigate]);

  // Image upload handler for markdown editor
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      const response = await uploadImage({ image: file });
      return `/images/${response.id}`; // Return the URL to be inserted in markdown
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw error;
    }
  }, []);

  const updateWriteupMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      updateWriteup(Number(writeupId), {
        ...data,
        categoryId: Number(data.categoryId),
      }),
    onSuccess: async (data, _variables, _onMutateResult, context) => {
      await context.client.invalidateQueries({ queryKey: ["ctfs", data.ctfId.toString()] });
      updateContentMutation.mutate(content);
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: (content: string) => updateWriteupContent(Number(writeupId), { content }),
    onSuccess: () => {
      navigate({ to: `/writeups/$writeupId`, params: { writeupId } });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, tagIds: selectedOptions }));
  };

  const handleContentChange = (value: string) => {
    setContent(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWriteupMutation.mutate(formData);
  };

  if (isLoadingWriteup || isLoadingContent) return <div>Loading writeup...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Writeup</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-medium">
            Title <span className="text-red-500">*</span>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </label>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Category <span className="text-red-500">*</span>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Tags
            <select
              name="tags"
              multiple
              value={formData.tagIds}
              onChange={handleTagChange}
              className="w-full px-3 py-2 border rounded-md"
              size={4}
            >
              {tags?.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple tags</p>
        </div>

        <div>
          <label htmlFor="content" className="block mb-2 font-medium">
            Content <span className="text-red-500">*</span>
          </label>
          <MarkdownEditor value={content} onChange={handleContentChange} onImageUpload={handleImageUpload} />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={updateWriteupMutation.isPending || updateContentMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {updateWriteupMutation.isPending || updateContentMutation.isPending ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/writeups/$writeupId", params: { writeupId } })}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>

        {(updateWriteupMutation.isError || updateContentMutation.isError) && (
          <div className="p-3 bg-red-100 text-red-700 rounded">
            Error: {updateWriteupMutation.error?.message || updateContentMutation.error?.message}
          </div>
        )}
      </form>
    </div>
  );
}
