"use client";

import { useRouter } from "next/navigation";
import LinkCreatedView from "@/components/link-created-view";
import { Suspense } from "react";

export default function CreatedPage() {
  const router = useRouter();
  
  const handleBack = () => {
    router.push('/');
  };
  
  return (
    <div className="container mx-auto max-w-lg py-12">
      <Suspense fallback={<div>読み込み中...</div>}>
        <LinkCreatedView onBack={handleBack} />
      </Suspense>
    </div>
  );
} 