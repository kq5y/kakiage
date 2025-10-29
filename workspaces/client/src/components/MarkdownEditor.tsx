import { markdownToHtml } from "@kakiage/processor";
import { useEffect, useRef, useState } from "react";

import { getImageUploadSign } from "@/libs/api";
import { uploadImage } from "@/libs/cloudinary";

import "@/assets/article.scss";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const html = await markdownToHtml(value);
      setRenderedHtml(html);
    })();
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!textareaRef.current) return;

    const file = files[0];
    setIsUploading(true);

    try {
      const signData = await getImageUploadSign();
      const imageUrl = await uploadImage(file, signData);

      const textArea = textareaRef.current;
      const cursorPos = textArea.selectionStart || value.length;
      const textBefore = value.substring(0, cursorPos);
      const textAfter = value.substring(cursorPos);

      const imageMarkdown = `![${file.name}](${imageUrl})`;
      onChange(`${textBefore}\n${imageMarkdown}\n${textAfter}`);

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
    <div className="flex-1 overflow-hidden w-full min-h-0 grid grid-cols-2">
      <div className="w-full h-full border-r border-gray-300 overflow-hidden">
        <div className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            <span>Editor</span>
            <button
              type="button"
              onClick={handleImageButtonClick}
              disabled={isUploading}
              className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload Image"}
            </button>
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </div>
          <textarea
            ref={textareaRef}
            name="content"
            value={value}
            onChange={handleTextChange}
            className="w-full flex-1 min-h-0 p-3 font-mono text-base leading-relaxed bg-white outline-none resize-none overflow-y-auto"
            spellCheck="false"
          />
        </div>
      </div>
      <div className="w-full h-full overflow-hidden">
        <div className="w-full h-full flex flex-col bg-gray-50">
          <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200 text-sm font-medium text-gray-600">
            <span>Preview</span>
          </div>
          <div className="w-full flex-1 min-h-0 p-3 overflow-y-auto">
            <div
              className="w-full max-w-none article"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized content
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
