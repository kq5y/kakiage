import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import MarkdownEditor from '@/components/MarkdownEditor';
import { createWriteup, getCategories, getCtfs, getTags, uploadImage } from '@/libs/api';

export const Route = createFileRoute('/writeups/new')({
  component: NewWriteupPage,
  beforeLoad: async ({ context }) => {
    const user = context.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to create a writeup');
    }
    
    return {};
  },
  validateSearch: (search: Record<string, unknown>): {
    ctfId?: number
  } => {
    return {
      ctfId: (search.ctfId as number) || undefined
    }
  }
});

function NewWriteupPage() {
  const navigate = useNavigate();
  const { ctfId: ctfIdFromSearch } = Route.useSearch();
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    ctfId: ctfIdFromSearch ? ctfIdFromSearch.toString() : '',
    categoryId: '',
    tagIds: [] as string[],
  });

  // Fetch necessary data
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const { data: ctfs } = useQuery({
    queryKey: ['ctfs'],
    queryFn: getCtfs
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags
  });

  // Set the default category if categories are loaded
  useEffect(() => {
    if (categories?.length && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id.toString() }));
    }
  }, [categories, formData.categoryId]);

  // Image upload handler for markdown editor
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      const response = await uploadImage({image: file});
      return response.path;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }, []);

  const createWriteupMutation = useMutation({
    mutationFn: createWriteup,
    onSuccess: (data) => {
      navigate({ to: `/writeups/$writeupId`, params: { writeupId: data.id.toString() } });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, tagIds: selectedOptions }));
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWriteupMutation.mutate({
      ...formData,
      ctfId: Number(formData.ctfId),
      categoryId: Number(formData.categoryId),
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Create New Writeup</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block mb-2 font-medium">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ctfId" className="block mb-2 font-medium">
              CTF <span className="text-red-500">*</span>
            </label>
            <select
              id="ctfId"
              name="ctfId"
              value={formData.ctfId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select CTF</option>
              {ctfs?.map(ctf => (
                <option key={ctf.id} value={ctf.id}>
                  {ctf.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="categoryId" className="block mb-2 font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              {categories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="tags" className="block mb-2 font-medium">
            Tags
          </label>
          <select
            id="tags"
            name="tags"
            multiple
            value={formData.tagIds}
            onChange={handleTagChange}
            className="w-full px-3 py-2 border rounded-md"
            size={4}
          >
            {tags?.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple tags</p>
        </div>
        
        <div>
          <label htmlFor="content" className="block mb-2 font-medium">
            Content <span className="text-red-500">*</span>
          </label>
          <MarkdownEditor
            value={formData.content}
            onChange={handleContentChange}
            onImageUpload={handleImageUpload}
          />
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createWriteupMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {createWriteupMutation.isPending ? 'Creating...' : 'Create Writeup'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate({ to: '/ctfs' })}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
        
        {createWriteupMutation.isError && (
          <div className="p-3 bg-red-100 text-red-700 rounded">
            Error: {createWriteupMutation.error.message}
          </div>
        )}
      </form>
    </div>
  );
}
