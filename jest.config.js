module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.(ttf|otf|xml)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
