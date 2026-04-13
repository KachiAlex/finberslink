import { S3Storage } from '@/services/pdf/s3-storage';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3Storage', () => {
  let s3Storage: S3Storage;
  let mockS3Client: jest.Mocked<S3Client>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Client = new S3Client({}) as jest.Mocked<S3Client>;

    s3Storage = new S3Storage({
      bucket: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      cloudFrontDomain: 'https://cdn.example.com',
    });
  });

  describe('PDF upload', () => {
    it('should upload PDF to S3', async () => {
      const buffer = Buffer.from('test pdf content');
      const fileName = 'test-resume.pdf';

      (mockS3Client.send as jest.Mock).mockResolvedValue({});

      const key = await s3Storage.uploadPdf(buffer, fileName);

      expect(key).toContain('resumes/');
      expect(key).toContain('test-resume.pdf');
    });

    it('should include metadata in S3 upload', async () => {
      const buffer = Buffer.from('test pdf content');
      const fileName = 'test-resume.pdf';
      const metadata = {
        resumeId: 'resume-123',
        template: 'Modern',
      };

      (mockS3Client.send as jest.Mock).mockResolvedValue({});

      await s3Storage.uploadPdf(buffer, fileName, metadata);

      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('should throw error on upload failure', async () => {
      const buffer = Buffer.from('test pdf content');
      const fileName = 'test-resume.pdf';

      (mockS3Client.send as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      await expect(s3Storage.uploadPdf(buffer, fileName)).rejects.toThrow('Failed to upload PDF to S3');
    });
  });

  describe('PDF URL generation', () => {
    it('should return CloudFront URL when configured', async () => {
      const key = 'resumes/123/test.pdf';
      const url = await s3Storage.getPdfUrl(key);

      expect(url).toBe(`https://cdn.example.com/${key}`);
    });

    it('should generate signed S3 URL when CloudFront not configured', async () => {
      const s3StorageNoCloudFront = new S3Storage({
        bucket: 'test-bucket',
        region: 'us-east-1',
      });

      const key = 'resumes/123/test.pdf';
      const signedUrl = 'https://s3.amazonaws.com/signed-url';

      (getSignedUrl as jest.Mock).mockResolvedValue(signedUrl);

      const url = await s3StorageNoCloudFront.getPdfUrl(key);

      expect(url).toBe(signedUrl);
    });

    it('should throw error on URL generation failure', async () => {
      const s3StorageNoCloudFront = new S3Storage({
        bucket: 'test-bucket',
        region: 'us-east-1',
      });

      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('URL generation failed'));

      await expect(s3StorageNoCloudFront.getPdfUrl('test-key')).rejects.toThrow('Failed to generate PDF URL');
    });
  });

  describe('PDF deletion', () => {
    it('should delete PDF from S3', async () => {
      const key = 'resumes/123/test.pdf';

      (mockS3Client.send as jest.Mock).mockResolvedValue({});

      await s3Storage.deletePdf(key);

      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('should throw error on deletion failure', async () => {
      const key = 'resumes/123/test.pdf';

      (mockS3Client.send as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

      await expect(s3Storage.deletePdf(key)).rejects.toThrow('Failed to delete PDF from S3');
    });
  });

  describe('S3 key generation', () => {
    it('should generate valid S3 keys', async () => {
      const buffer = Buffer.from('test');
      const fileName = 'test-resume.pdf';

      (mockS3Client.send as jest.Mock).mockResolvedValue({});

      const key = await s3Storage.uploadPdf(buffer, fileName);

      expect(key).toMatch(/^resumes\/\d+\/test-resume\.pdf$/);
    });

    it('should sanitize special characters in filename', async () => {
      const buffer = Buffer.from('test');
      const fileName = 'test@resume#2024.pdf';

      (mockS3Client.send as jest.Mock).mockResolvedValue({});

      const key = await s3Storage.uploadPdf(buffer, fileName);

      expect(key).not.toContain('@');
      expect(key).not.toContain('#');
    });
  });
});
