module.exports = {
  preset: '@react-native/jest-preset',
  modulePathIgnorePatterns: ['<rootDir>/android/hermes-patched/build/'],
  moduleNameMapper: {
    '\\.(ttf|otf|xml|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
