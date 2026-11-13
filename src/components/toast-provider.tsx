"use client";

import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import FlashToast from "@/components/flash-toast";

export default function ToastProvider() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        limit={3}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </>
  );
}