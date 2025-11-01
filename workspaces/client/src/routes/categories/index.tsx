import type { Category } from "@kakiage/server/rpc";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { createCategory, deleteCategory, updateCategory } from "@/libs/api";
import { categoriesQueryOptions } from "@/queries/categories";
import { createPageTitle } from "@/utils/meta";

export const Route = createFileRoute("/categories/")({
  component: CategoriesPage,
  beforeLoad: async ({ context }) => {
    await context.auth.ensureLoaded();

    const user = context.auth.getUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (user.role !== "admin") {
      throw redirect({ to: "/" });
    }

    return {};
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(categoriesQueryOptions);
  },
  head: () => ({
    meta: [{ title: createPageTitle("Manage Categories") }],
  }),
  pendingComponent: () => <div>Loading categories...</div>,
  errorComponent: ({ error }) => <div>Error loading categories: {error.message}</div>,
});

function CategoryForm<T>({
  mode,
  data,
  handleChange,
  handleSubmit,
  saveMutation,
  onCancel,
  onDelete,
  deleteMutation,
}: {
  mode: "add" | "edit";
  data: { name: string; color: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  saveMutation: ReturnType<typeof useMutation<Category, Error, T, unknown>>;
  onCancel: () => void;
  onDelete?: () => void;
  deleteMutation?: ReturnType<typeof useMutation<true, Error, number, unknown>>;
}) {
  return (
    <div className="p-6 bg-gray-50">
      <h3 className="text-xl font-semibold mb-4">{mode === "add" ? "Create Category" : "Edit Category"}</h3>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color <span className="text-red-500">*</span>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                name="color"
                value={data.color}
                onChange={handleChange}
                className="w-12 h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                name="color"
                value={data.color}
                onChange={handleChange}
                placeholder="#xxxxxx"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                required
              />
            </div>
          </label>
        </div>
        <div className="flex justify-end items-center space-x-3 pt-2">
          {mode === "edit" && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteMutation?.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow mr-auto text-base"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow text-base"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoriesPage() {
  const categories = Route.useLoaderData();

  const [formMode, setFormMode] = useState<"add" | "edit" | "closed">("closed");

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", color: "" });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["categories"] });
      setNewCategory({ name: "", color: "" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (category: Category) => updateCategory(category.id, category),
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate(newCategory);
    setFormMode("closed");
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate(editingCategory);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingCategory(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({ ...prev, [name]: value }));
  };

  const confirmDelete = (category: Category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  return (
    <div className="max-w-lg w-full px-2">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-3">Manage Categories</h1>
        <button
          type="button"
          onClick={() => setFormMode("add")}
          disabled={formMode === "add"}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-default text-base"
        >
          Add
        </button>
      </div>

      {createCategoryMutation.isError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error creating category: {createCategoryMutation.error.message}
        </div>
      )}

      {updateCategoryMutation.isError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error updating category: {updateCategoryMutation.error.message}
        </div>
      )}

      {deleteCategoryMutation.isError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error deleting category: {deleteCategoryMutation.error.message}
        </div>
      )}

      {formMode === "add" && (
        <CategoryForm
          mode="add"
          data={newCategory}
          handleChange={handleNewCategoryChange}
          handleSubmit={handleCreateSubmit}
          saveMutation={createCategoryMutation}
          onCancel={() => {
            setFormMode("closed");
            setNewCategory({ name: "", color: "" });
          }}
        />
      )}

      <div className="mt-4 rounded-lg overflow-hidden shadow-md border border-gray-200">
        <table className="w-full min-w-max text-left bg-white">
          <thead className="bg-gray-100 border-0 border-b border-gray-300 border-solid">
            <tr>
              <th className="p-4 font-semibold text-gray-700">ID</th>
              <th className="p-4"></th>
              <th className="p-4 font-semibold text-gray-700">Name</th>
              <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No categories available.
                </td>
              </tr>
            )}
            {categories.map(category => (
              <>
                <tr
                  key={category.id}
                  className={`border-b border-gray-200 transition-colors ${formMode === "edit" && editingCategory?.id === category.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <td className="p-4 text-gray-600 font-mono">{category.id}</td>
                  <td className="p-4">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: category.color }}
                      title={category.color}
                    ></div>
                  </td>
                  <td className="p-4 text-gray-900 font-medium">{category.name}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormMode("edit");
                          setEditingCategory(category);
                        }}
                        disabled={formMode === "edit" && editingCategory?.id === category.id}
                        className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 disabled:bg-yellow-300 transition-colors disabled:cursor-default"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
                {formMode === "edit" && editingCategory?.id === category.id && (
                  <tr className="border-b border-gray-200">
                    <td colSpan={4} className="p-0 bg-gray-50">
                      <CategoryForm
                        data={editingCategory}
                        mode="edit"
                        handleChange={handleEditChange}
                        handleSubmit={handleUpdateSubmit}
                        saveMutation={updateCategoryMutation}
                        onCancel={() => {
                          setFormMode("closed");
                          setEditingCategory(null);
                        }}
                        onDelete={() => confirmDelete(editingCategory)}
                        deleteMutation={deleteCategoryMutation}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
