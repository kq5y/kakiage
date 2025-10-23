import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export default function MarkdownEditor({ value, onChange, onImageUpload }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (isPreview) {
        const dirty = await marked(value, {
          breaks: true,
          gfm: true,
        });
        const html = DOMPurify.sanitize(dirty);
        setRenderedHtml(html);
      }
    })();
  }, [value, isPreview]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);

    try {
      const imageUrl = await onImageUpload(file);

      // Insert image markdown at cursor position or at the end
      const textArea = document.querySelector("textarea");
      const cursorPos = textArea?.selectionStart || value.length;
      const textBefore = value.substring(0, cursorPos);
      const textAfter = value.substring(cursorPos);

      const imageMarkdown = `![${file.name}](${imageUrl})`;
      onChange(`${textBefore}\n${imageMarkdown}\n${textAfter}`);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleImageButtonClick}
            disabled={isPreview || isUploading}
            className="text-gray-600 hover:text-gray-900 disabled:text-gray-400"
            title="Upload image"
          >
            {isUploading ? "Uploading..." : "Image"}
          </button>
          <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageUpload} />
        </div>

        <div className="flex rounded overflow-hidden border">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`px-3 py-1 ${!isPreview ? "bg-white" : "bg-gray-100"}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`px-3 py-1 ${isPreview ? "bg-white" : "bg-gray-100"}`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="min-h-[300px] max-h-[600px]">
        {isPreview ? (
          <div
            className="p-4 h-full overflow-auto prose max-w-none"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized above
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          <textarea
            value={value}
            onChange={handleTextChange}
            className="w-full h-full p-4 resize-none focus:outline-none"
            placeholder="Write your content in markdown format..."
            rows={12}
          />
        )}
      </div>
    </div>
  );
}
