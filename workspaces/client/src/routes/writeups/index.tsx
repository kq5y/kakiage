import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/writeups/")({
  component: EditWriteupPage,
});

function EditWriteupPage() {
  return <div>todo</div>;
}
