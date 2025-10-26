import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getCtfDetail, updateCtf } from "@/libs/api";

export const Route = createFileRoute("/ctfs/$ctfId/edit")({
  component: EditCtfPage,
  beforeLoad: async ({ context, params }) => {
    await context.auth.ensureLoaded();

    const user = context.auth.getUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (user.role !== "admin") {
      throw redirect({ to: "/ctfs/$ctfId", params: { ctfId: params.ctfId } });
    }

    return { ctfId: params.ctfId };
  },
});

function EditCtfPage() {
  const { ctfId } = Route.useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    startAt: "",
    endAt: "",
    url: "",
  });

  const {
    data: ctf,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ctfs", ctfId],
    queryFn: () => getCtfDetail(Number(ctfId)),
  });

  useEffect(() => {
    if (ctf) {
      setFormData({
        name: ctf.name,
        startAt: ctf.startAt.toISOString().slice(0, 16),
        endAt: ctf.endAt.toISOString().slice(0, 16),
        url: ctf.url || "",
      });
    }
  }, [ctf]);

  const updateCtfMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateCtf>[1]) => updateCtf(Number(ctfId), data),
    onSuccess: () => {
      navigate({ to: `/ctfs/$ctfId`, params: { ctfId } });
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

  if (isLoading) return <div>Loading CTF details...</div>;
  if (error) return <div>Error loading CTF: {error.message}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit CTF: {ctf?.name}</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            CTF Name <span className="text-red-500">*</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">
              Start Date <span className="text-red-500">*</span>
              <input
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
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
                className="w-full px-3 py-2 border rounded-md"
              />
            </label>
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium">
            CTF URL
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://example.com"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={updateCtfMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {updateCtfMutation.isPending ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/ctfs/$ctfId", params: { ctfId } })}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>

        {updateCtfMutation.isError && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">Error: {updateCtfMutation.error.message}</div>
        )}
      </form>
    </div>
  );
}
