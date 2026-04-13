import { PublicResumeViewer } from '@/components/resume/public-resume-viewer';

interface PublicResumePageProps {
  params: {
    publicId: string;
  };
}

export default function PublicResumePage({ params }: PublicResumePageProps) {
  return <PublicResumeViewer publicId={params.publicId} />;
}
