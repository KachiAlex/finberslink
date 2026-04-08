"use client";

import { useState } from "react";
import { X, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TutorCourseBuilder } from "@/app/tutor/courses/new/page";

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "tutor" | "admin";
  backHref?: string;
  backLabel?: string;
}

export function CreateCourseModal({ 
  isOpen, 
  onClose, 
  userType,
  backHref = userType === "admin" ? "/admin/courses" : "/tutor/courses",
  backLabel = userType === "admin" ? "Back to course management" : "Back to courses"
}: CreateCourseModalProps) {
  const [isBuilderReady, setIsBuilderReady] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const handleClose = () => {
    setIsBuilderReady(false);
    setModalKey(prev => prev + 1); // Force re-render to clear state
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Create New Course
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="px-6 py-4">
          {/* Only render the builder when the modal is open to avoid unnecessary API calls */}
          {isOpen && (
            <div className="animate-in fade-in-0 duration-300">
              <TutorCourseBuilder
                key={modalKey} // Force fresh state on each open
                draftEndpoint="/api/tutor/courses/draft"
                coursesEndpoint="/api/tutor/courses"
                requiresReview={userType === "tutor"}
                isModalMode={true}
                onCourseCreated={handleClose}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing the modal state
export function useCreateCourseModal(userType: "tutor" | "admin") {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openModal,
    closeModal,
    CreateCourseModal: (props: Omit<CreateCourseModalProps, 'isOpen' | 'onClose' | 'userType'>) => (
      <CreateCourseModal
        {...props}
        isOpen={isOpen}
        onClose={closeModal}
        userType={userType}
      />
    )
  };
}
