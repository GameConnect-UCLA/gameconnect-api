export class Meilisearch {
  health = jest.fn().mockResolvedValue({ status: 'available' });
  index = jest.fn().mockReturnValue({
    updateSettings: jest.fn().mockResolvedValue({}),
    search: jest.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0 }),
    addDocuments: jest.fn().mockResolvedValue({ taskUid: 1 }),
    deleteDocument: jest.fn().mockResolvedValue({}),
  });
}
