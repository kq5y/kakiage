import type { Category } from "@kakiage/server/rpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { createCategory, deleteCategory, getCategories, updateCategory } from "@/libs/api";

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
});

function CategoriesPage() {
  const queryClient = useQueryClient();
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", color: "" });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategory({ name: "", color: "" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (category: Category) => updateCategory(category.id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate(newCategory);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate(editingCategory);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingCategory((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCategory((prev) => ({ ...prev, [name]: value }));
  };

  const confirmDelete = (category: Category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  if (isLoading) return <div>Loading categories...</div>;
  if (error) return <div>Error loading categories: {error.message}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Categories</h1>

      {/* Create New Category */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">
              Category Name <span className="text-red-500">*</span>
              <input
                type="text"
                name="name"
                value={newCategory.name}
                onChange={handleNewCategoryChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </label>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Color
              <input
                type="text"
                name="color"
                value={newCategory.color}
                onChange={handleNewCategoryChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={createCategoryMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
          </button>

          {createCategoryMutation.isError && (
            <div className="p-3 bg-red-100 text-red-700 rounded">Error: {createCategoryMutation.error.message}</div>
          )}
        </form>
      </div>

      {/* Categories List */}
      <h2 className="text-xl font-semibold mb-4">Existing Categories</h2>

      {categories?.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-gray-500">No categories available. Create your first category above.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories?.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCategory?.id === category.id ? (
                      <input
                        type="text"
                        name="name"
                        value={editingCategory.name}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingCategory?.id === category.id ? (
                      <input
                        type="text"
                        name="color"
                        value={editingCategory.color}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{category.color}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingCategory?.id === category.id ? (
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={handleUpdateSubmit}
                          disabled={updateCategoryMutation.isPending}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingCategory(category)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(category)}
                          disabled={deleteCategoryMutation.isPending}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
