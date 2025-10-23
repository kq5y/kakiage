import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { createCtf } from "@/libs/api";

export const Route = createFileRoute("/ctfs/new")({
  component: NewCtfPage,
  beforeLoad: async ({ context }) => {
    const user = context.auth.getUser();

    if (!user || user.role !== "admin") {
      throw new Error("You must be an admin to access this page");
    }

    return {};
  },
});

function NewCtfPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    startAt: "",
    endAt: "",
    url: "",
  });

  const createCtfMutation = useMutation({
    mutationFn: createCtf,
    onSuccess: (data) => {
      navigate({ to: `/ctfs/$ctfId`, params: { ctfId: data.id.toString() } });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCtfMutation.mutate({
      ...formData,
      startAt: new Date(formData.startAt).getTime(),
      endAt: new Date(formData.endAt).getTime(),
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Create New CTF</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label htmlFor="name" className="block mb-2 font-medium">
            CTF Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="startAt" className="block mb-2 font-medium">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="startAt"
              name="startAt"
              value={formData.startAt}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="endAt" className="block mb-2 font-medium">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="endAt"
              name="endAt"
              value={formData.endAt}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="url" className="block mb-2 font-medium">
            CTF URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="https://example.com"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createCtfMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {createCtfMutation.isPending ? "Creating..." : "Create CTF"}
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/ctfs" })}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>

        {createCtfMutation.isError && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">Error: {createCtfMutation.error.message}</div>
        )}
      </form>
    </div>
  );
}
