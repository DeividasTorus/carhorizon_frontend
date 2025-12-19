// Jest setup file
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (obj) => obj.android || obj.default,
  },
}));
