import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import MarkdownEditor from "@/components/MarkdownEditor";
import { useAuth } from "@/hooks/useAuth";
import {
  getCategories,
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

  const { data: rawContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ["writeups", writeupId, "raw-content"],
    queryFn: () => getWriteupContent(Number(writeupId)),
  });

  useEffect(() => {
    if (rawContent == null) return;
    setContent(rawContent);
  }, [rawContent]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  useEffect(() => {
    if (user && originalAuthorId && user.id !== originalAuthorId && user.role !== "admin") {
      navigate({ to: `/writeups/$writeupId`, params: { writeupId } });
    }
  }, [user, originalAuthorId, writeupId, navigate]);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      const response = await uploadImage({ image: file });
      return `/images/${response.id}`;
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

  const handleContentChange = (value: string) => {
    setContent(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWriteupMutation.mutate(formData);
  };

  if (isLoadingWriteup || isLoadingContent) return <div>Loading writeup...</div>;

  return (
    <div className="max-w-dvw w-full flex-grow flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-6 mb-2">
        <div className="mx-2 space-y-2">
          <div className="flex items-center justify-between space-x-2">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full text-xl font-semibold p-2 border border-transparent focus:border-blue-400 rounded-lg outline-none transition-all duration-200"
            />
            <button
              type="submit"
              disabled={updateWriteupMutation.isPending || updateContentMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-base rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {updateWriteupMutation.isPending || updateContentMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>

          <div>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="px-3 py-2 border rounded-md"
            >
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      <MarkdownEditor value={content} onChange={handleContentChange} onImageUpload={handleImageUpload} />
    </div>
  );
}
