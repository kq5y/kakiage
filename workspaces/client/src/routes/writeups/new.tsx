import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { createWriteup, getCategories, getCtfs } from "@/libs/api";

export const Route = createFileRoute("/writeups/new")({
  component: NewWriteupPage,
  beforeLoad: async ({ context }) => {
    await context.auth.ensureLoaded();

    const user = context.auth.getUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }

    return {};
  },
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    ctfId?: number;
  } => {
    return {
      ctfId: (search.ctfId as number) || undefined,
    };
  },
});

function NewWriteupPage() {
  const navigate = useNavigate();
  const { ctfId: ctfIdFromSearch } = Route.useSearch();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    ctfId: ctfIdFromSearch ? ctfIdFromSearch.toString() : "",
    categoryId: "",
    points: "",
    solvers: "",
    password: "",
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: ctfs } = useQuery({
    queryKey: ["ctfs"],
    queryFn: getCtfs,
  });

  useEffect(() => {
    if (categories?.length && !formData.categoryId) {
      setFormData((prev) => ({ ...prev, categoryId: categories[0].id.toString() }));
    }
  }, [categories, formData.categoryId]);

  const createWriteupMutation = useMutation({
    mutationFn: createWriteup,
    onSuccess: async (data, _variables, _onMutateResult, context) => {
      await context.client.invalidateQueries({ queryKey: ["ctfs", data.ctfId.toString()] });
      navigate({ to: `/writeups/$writeupId/edit`, params: { writeupId: data.id.toString() } });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWriteupMutation.mutate({
      ...formData,
      ctfId: Number(formData.ctfId),
      categoryId: Number(formData.categoryId),
      points: Number(formData.points),
      solvers: Number(formData.solvers),
    });
  };

  return (
    <div className="max-w-lg w-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-3">Create New Writeup</h1>

      {createWriteupMutation.isError && (
        <div className="p-3 bg-red-100 text-red-700 rounded">Error: {createWriteupMutation.error.message}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">
            Title <span className="text-red-500">*</span>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </label>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Slug <span className="text-red-500">*</span>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              pattern="^[a-zA-Z0-9_-]+$"
              minLength={1}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium">
              CTF <span className="text-red-500">*</span>
              <select
                name="ctfId"
                value={formData.ctfId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select CTF</option>
                {ctfs?.map((ctf) => (
                  <option key={ctf.id} value={ctf.id}>
                    {ctf.name}
                  </option>
                ))}
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium">
              Points
              <input
                type="number"
                name="points"
                min={0}
                value={formData.points}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Solvers
              <input
                type="number"
                name="solvers"
                min={0}
                value={formData.solvers}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </label>
        </div>

        <div className="flex justify-end items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/ctfs" })}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-base"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={createWriteupMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-default shadow text-base"
          >
            {createWriteupMutation.isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
