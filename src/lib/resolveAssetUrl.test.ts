import { getApiBaseUrl } from './apiBase';
import { resolveAssetUrl } from './resolveAssetUrl';

jest.mock('./apiBase', () => ({
  getApiBaseUrl: jest.fn(() => 'https://api.example.com'),
}));

const getApiBaseUrlMock = getApiBaseUrl as jest.Mock;

describe('resolveAssetUrl', () => {
  beforeEach(() => {
    getApiBaseUrlMock.mockReturnValue('https://api.example.com');
  });

  it('should return null for null, undefined or empty string', () => {
    expect(resolveAssetUrl(null)).toBeNull();
    expect(resolveAssetUrl(undefined)).toBeNull();
    expect(resolveAssetUrl('')).toBeNull();
  });

  it('should return absolute http(s) urls unchanged', () => {
    expect(resolveAssetUrl('https://cdn.example.com/a.png')).toBe(
      'https://cdn.example.com/a.png',
    );
    expect(resolveAssetUrl('http://cdn.example.com/a.png')).toBe('http://cdn.example.com/a.png');
  });

  it('should prefix relative paths that start with /', () => {
    expect(resolveAssetUrl('/api/uploads/avatars/x.jpg')).toBe(
      'https://api.example.com/api/uploads/avatars/x.jpg',
    );
  });

  it('should insert a slash when relative path has no leading slash', () => {
    expect(resolveAssetUrl('api/uploads/avatars/x.jpg')).toBe(
      'https://api.example.com/api/uploads/avatars/x.jpg',
    );
  });
});
