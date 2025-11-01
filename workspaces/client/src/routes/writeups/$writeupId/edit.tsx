import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import MarkdownEditor from "@/components/MarkdownEditor";
import { addWriteupTag, removeWriteupTag, updateWriteup, updateWriteupContent } from "@/libs/api";
import { categoriesQueryOptions } from "@/queries/categories";
import { ctfsQueryKeys } from "@/queries/ctfs";
import { writeupQueryOptions, writeupsQueryKeys, writeupTagsQueryOptions } from "@/queries/writeups";
import { createPageTitle } from "@/utils/meta";

export const Route = createFileRoute("/writeups/$writeupId/edit")({
  component: EditWriteupPage,
  params: {
    parse: ({ writeupId }) => ({ writeupId: Number(writeupId) }),
  },
  beforeLoad: async ({ context }) => {
    await context.auth.ensureLoaded();

    const user = context.auth.getUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }

    return {};
  },
  loader: async ({ params, context }) => {
    const writeup = await context.queryClient.ensureQueryData(writeupQueryOptions(params.writeupId, true));
    const user = context.auth.getUser();
    if (user && user.id !== writeup.createdByUser.id && user.role !== "admin") {
      throw redirect({ to: "/writeups/$writeupId", params: { writeupId: params.writeupId } });
    }

    const categories = await context.queryClient.ensureQueryData(categoriesQueryOptions);
    const tags = await context.queryClient.ensureQueryData(writeupTagsQueryOptions(params.writeupId));
    return { writeup, categories, tags };
  },
  head: ctx => ({
    meta: [{ title: createPageTitle(ctx.loaderData?.writeup.title || "") }],
  }),
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: ({ error }) => <div>Error: {(error as Error).message}</div>,
});

function EditWriteupPage() {
  const queryClient = useQueryClient();
  const { writeupId } = Route.useParams();
  const navigate = useNavigate();
  const { writeup, categories, tags } = Route.useLoaderData();

  const [formData, setFormData] = useState({
    title: writeup.title,
    categoryId: String(writeup.category.id),
  });

  const [content, setContent] = useState(writeup.content || "");
  const [newTagName, setNewTagName] = useState("");

  const updateWriteupMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      updateWriteup(writeupId, {
        ...data,
        categoryId: Number(data.categoryId),
      }),
    onSuccess: async data => {
      await queryClient.invalidateQueries({ queryKey: ctfsQueryKeys.detail(data.ctfId) });
      await queryClient.invalidateQueries({ queryKey: writeupsQueryKeys.detail(writeupId) });
      updateContentMutation.mutate(content);
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: (content: string) => updateWriteupContent(writeupId, { content }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: writeupsQueryKeys.detail(writeupId, true) });
      await queryClient.invalidateQueries({ queryKey: writeupsQueryKeys.content(writeupId) });
      navigate({ to: "/writeups/$writeupId", params: { writeupId } });
    },
  });

  const addTagMutation = useMutation({
    mutationFn: (tagName: string) => addWriteupTag(writeupId, { name: tagName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: writeupsQueryKeys.tags(writeupId) });
      setNewTagName("");
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: number) => removeWriteupTag(writeupId, { id: tagId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: writeupsQueryKeys.tags(writeupId) });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (value: string) => {
    setContent(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWriteupMutation.mutate(formData);
  };

  const handleNewTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTagName.trim() !== "") {
      e.preventDefault();
      if (!addTagMutation.isPending) {
        addTagMutation.mutate(newTagName.trim());
      }
    }
  };

  const handleRemoveTag = (tagId: number) => {
    if (!removeTagMutation.isPending) {
      removeTagMutation.mutate(tagId);
    }
  };

  return (
    <div className="max-w-dvw w-full flex-1 min-h-0 flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-6 mb-2">
        <div className="mx-2 space-y-1">
          <div className="flex items-center justify-between space-x-2">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full text-xl font-semibold shadow p-2 border border-transparent focus:border-blue-400 rounded-lg outline-none transition-all duration-200"
            />
            <button
              type="submit"
              disabled={updateWriteupMutation.isPending || updateContentMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-base rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {updateWriteupMutation.isPending || updateContentMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <div className="p-1">
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="px-2 py-1 border rounded-md"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-1 border rounded-md flex-grow">
              {tags.map(tag => (
                <span
                  key={tag.id}
                  className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm font-medium text-gray-700"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    disabled={removeTagMutation.isPending}
                    className="ml-1 text-white bg-red-600 rounded-full px-1 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-300"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {tags.length < 10 && (
                <input
                  type="text"
                  name="newTag"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={handleNewTagKeyDown}
                  disabled={addTagMutation.isPending}
                  placeholder="Add tag"
                  className="px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[100px]"
                />
              )}
            </div>
          </div>
        </div>
      </form>

      <MarkdownEditor value={content} onChange={handleContentChange} />
    </div>
  );
}
