module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.(ttf|otf)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
