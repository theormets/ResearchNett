import { Suspense } from "react";
import FeedbackForm from "./FeedbackForm";

export const dynamic = "force-dynamic"; // don't prerender
export const revalidate = 0;

export default function FeedbackPage() {
  return (
    <Suspense fallback={<section><h1>Feedback</h1><p>Loading…</p></section>}>
      <FeedbackForm />
    </Suspense>
  );
}
