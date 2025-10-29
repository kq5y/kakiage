import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { updateCtf } from "@/libs/api";
import { ctfDetailQueryOptions } from "@/queries/ctfs";

export const Route = createFileRoute("/ctfs/$ctfId/edit")({
  component: EditCtfPage,
  params: {
    parse: ({ ctfId }) => ({ ctfId: Number(ctfId) }),
  },
  beforeLoad: async ({ context, params }) => {
    await context.auth.ensureLoaded();

    const user = context.auth.getUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (user.role !== "admin") {
      throw redirect({ to: "/ctfs/$ctfId", params: { ctfId: params.ctfId } });
    }

    return {};
  },
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(ctfDetailQueryOptions(params.ctfId));
  },
  pendingComponent: () => <div>Loading CTF details...</div>,
  errorComponent: ({ error }) => <div>Error loading CTF: {error.message}</div>,
});

function EditCtfPage() {
  const navigate = useNavigate();

  const ctf = Route.useLoaderData();
  const [formData, setFormData] = useState({
    name: ctf.name,
    startAt: ctf.startAt.toISOString().slice(0, 16),
    endAt: ctf.endAt.toISOString().slice(0, 16),
    url: ctf.url || "",
  });

  const updateCtfMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateCtf>[1]) => updateCtf(ctf.id, data),
    onSuccess: async (_data, _variables, _onMutateResult, context) => {
      await context.client.invalidateQueries({ queryKey: ["ctfs", ctf.id] });
      navigate({ to: "/ctfs/$ctfId", params: { ctfId: ctf.id } });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCtfMutation.mutate({
      ...formData,
      startAt: new Date(formData.startAt).getTime(),
      endAt: new Date(formData.endAt).getTime(),
    });
  };

  return (
    <div className="max-w-lg w-full px-2">
      <h1 className="text-3xl font-bold mb-3">Edit CTF</h1>

      {updateCtfMutation.isError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">Error: {updateCtfMutation.error.message}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">
            Name <span className="text-red-500">*</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium">
              Start Date <span className="text-red-500">*</span>
              <input
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              End Date <span className="text-red-500">*</span>
              <input
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            URL <span className="text-red-500">*</span>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="https://example.com"
            />
          </label>
        </div>

        <div className="flex justify-end items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/ctfs/$ctfId", params: { ctfId: ctf.id } })}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-base"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={updateCtfMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-default shadow text-base"
          >
            {updateCtfMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
