"use client";

import { useRouter } from "next/navigation";
import LinkCreatedView from "@/components/link-created-view";

export default function CreatedPage() {
  const router = useRouter();
  
  const handleBack = () => {
    router.push('/');
  };
  
  return (
    <div className="container mx-auto max-w-lg py-12">
      <LinkCreatedView onBack={handleBack} />
    </div>
  );
} 